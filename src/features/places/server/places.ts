import 'server-only';
import { ObjectId, type Collection, type Filter, type Sort, type WithId } from 'mongodb';
import type { z } from 'zod';
import { cache, CACHE_TTL_SECONDS } from '@/lib/cache';
import { getMongo } from '@/lib/db/mongodb';
import { HttpError } from '@/lib/http';
import { slugify } from '@/lib/slug';
import { deriveAmenities } from '../amenities';
import { namePrefixPattern, rankMatches } from '../search';
import { refreshPlaceAmenities } from './amenity-sync';
import { syncPlaceAmenityEdges } from './amenity-graph';
import { deletePlaceNode, upsertPlaceNode } from './graph';
import type { placeInputSchema, placeUpdateSchema, placesQuerySchema } from '../schemas';
import type { Place } from '../types';

export type PlaceDoc = Omit<Place, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

async function placesCollection() {
  return (await getMongo()).collection<PlaceDoc>('places');
}

export function toPlace(doc: WithId<PlaceDoc>): Place {
  const { _id, createdAt, updatedAt, ...rest } = doc;
  delete (rest as { score?: number }).score; // điểm $text chỉ dùng để sắp xếp, không trả ra ngoài
  return {
    ...rest,
    amenities: rest.amenities ?? [], // bản ghi cũ chưa chạy db:backfill-amenities
    id: _id.toHexString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

// Node Place trước, rồi mới tới HAS_AMENITY (cần node Place đã tồn tại).
async function syncPlaceGraph(place: Place) {
  await upsertPlaceNode(place);
  await syncPlaceAmenityEdges([{ id: place.id, amenities: place.amenities }]);
}

const isDuplicateKey = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

export async function createPlace(input: z.output<typeof placeInputSchema>) {
  const collection = await placesCollection();
  const base = slugify(input.name) || 'dia-diem';
  const now = new Date();
  for (let attempt = 1; attempt <= 20; attempt++) {
    const doc: PlaceDoc = {
      ...input,
      slug: attempt === 1 ? base : `${base}-${attempt}`,
      // Địa điểm mới chưa có khách sạn/nhà hàng/dịch vụ nên chỉ suy ra từ category và tags.
      amenities: deriveAmenities({
        place: input,
        hotels: [],
        restaurants: [],
        services: [],
      }),
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const { insertedId } = await collection.insertOne(doc);
      await cache.invalidate();
      const created = toPlace({ ...doc, _id: insertedId });
      await syncPlaceGraph(created).catch((err) =>
        console.error('Lỗi đồng bộ Place sang Neo4j:', err),
      );
      return created;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
  throw new HttpError(409, 'Không tạo được đường dẫn (slug) duy nhất cho địa điểm.');
}

const SEARCH_MATCH_LIMIT = 1000;

// Các bộ lọc không liên quan tới từ khóa (danh mục, khu vực, đánh giá, tìm theo một phần tên).
function placeFilters(query: z.output<typeof placesQuerySchema>): Filter<PlaceDoc> {
  const filter: Filter<PlaceDoc> = {};
  if (query.category) filter.category = query.category;
  if (query.region) filter.region = query.region;
  // Tìm theo một phần tên, không phân biệt dấu (so khớp trên slug), dùng cho ô chọn địa điểm.
  const fragment = slugify(query.nameContains);
  if (fragment) filter.slug = { $regex: fragment };
  if (query.minRating > 0) filter.ratingAvg = { $gte: query.minRating };
  return filter;
}

// Có từ khóa: lấy id khớp full-text (kèm điểm) và id có tên khớp đầu từ, rồi hợp lại.
async function searchMatches(
  collection: Collection<PlaceDoc>,
  base: Filter<PlaceDoc>,
  search: string,
) {
  const pattern = namePrefixPattern(search);
  const [textDocs, nameDocs] = await Promise.all([
    collection
      .find(
        { ...base, $text: { $search: search } },
        { projection: { _id: 1, score: { $meta: 'textScore' } } },
      )
      .limit(SEARCH_MATCH_LIMIT)
      .toArray(),
    pattern
      ? collection
          .find({ $and: [base, { slug: { $regex: pattern } }] }, { projection: { _id: 1 } })
          .limit(SEARCH_MATCH_LIMIT)
          .toArray()
      : [],
  ]);
  const textScores = new Map(
    textDocs.map((doc) => [doc._id.toHexString(), (doc as { score?: number }).score ?? 0]),
  );
  return rankMatches(
    textScores,
    nameDocs.map((doc) => doc._id.toHexString()),
  );
}

export async function listPlaces(query: z.output<typeof placesQuerySchema>) {
  const collection = await placesCollection();
  const base = placeFilters(query);
  const direction = query.direction === 'asc' ? 1 : -1;
  const start = query.page * query.pageSize;

  if (!query.search) {
    // Không từ khóa: "phù hợp nhất" không có nghĩa nên quay về mới nhất.
    const sortField = query.sortBy === 'relevance' ? 'createdAt' : query.sortBy;
    const sort: Sort = { [sortField]: direction, _id: 1 };
    const [docs, total] = await Promise.all([
      collection.find(base).sort(sort).skip(start).limit(query.pageSize).toArray(),
      collection.countDocuments(base),
    ]);
    return { places: docs.map(toPlace), total };
  }

  const ids = await searchMatches(collection, base, query.search);
  if (query.sortBy === 'relevance') {
    // `ids` đã theo độ liên quan; chỉ lấy dữ liệu của trang hiện tại rồi xếp lại đúng thứ tự đó.
    const pageIds = ids.slice(start, start + query.pageSize);
    const docs = await collection
      .find({ _id: { $in: pageIds.map((id) => new ObjectId(id)) } })
      .toArray();
    const byId = new Map(docs.map((doc) => [doc._id.toHexString(), doc]));
    return {
      places: pageIds.flatMap((id) => byId.get(id) ?? []).map(toPlace),
      total: ids.length,
    };
  }
  const sort: Sort = { [query.sortBy]: direction, _id: 1 };
  const docs = await collection
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .sort(sort)
    .skip(start)
    .limit(query.pageSize)
    .toArray();
  return { places: docs.map(toPlace), total: ids.length };
}

// Tìm kiếm có cache Redis. `useCache: false` dùng để đo thời gian khi không có cache.
// Danh mục và khu vực đang có trong dữ liệu. Cache chung với phiên bản cache nên tự làm mới khi có ghi.
async function knownFacets() {
  const { value } = await cache.cached('places:facets', CACHE_TTL_SECONDS, async () => {
    const collection = await placesCollection();
    const [categories, regions] = await Promise.all([
      collection.distinct('category'),
      collection.distinct('region'),
    ]);
    return { categories, regions };
  });
  return value;
}

export async function hasUnknownFacet(query: { category: string; region: string }) {
  if (!query.category && !query.region) return false;
  const facets = await knownFacets();
  return (
    (!!query.category && !facets.categories.includes(query.category)) ||
    (!!query.region && !facets.regions.includes(query.region))
  );
}

export async function searchPlaces(
  query: z.output<typeof placesQuerySchema>,
  options: { useCache?: boolean } = {},
) {
  if (options.useCache === false) return { value: await listPlaces(query), hit: false };
  // Danh mục/khu vực không tồn tại chắc chắn không có kết quả: trả rỗng mà không tạo khóa cache,
  // để khách vô danh không làm đầy Redis bằng các giá trị ngẫu nhiên.
  if (await hasUnknownFacet(query)) return { value: { places: [], total: 0 }, hit: false };
  return cache.cached(cache.keyOf('places:search', query), CACHE_TTL_SECONDS, () =>
    listPlaces(query),
  );
}

export async function getPlace(id: string) {
  const doc = await (await placesCollection()).findOne({ _id: new ObjectId(id) });
  if (!doc) throw new HttpError(404, 'Không tìm thấy địa điểm.');
  return toPlace(doc);
}

export async function getPlaceBySlug(slug: string) {
  const doc = await (await placesCollection()).findOne({ slug });
  if (!doc) throw new HttpError(404, 'Không tìm thấy địa điểm.');
  return toPlace(doc);
}

export async function listRegions() {
  const regions = await (await placesCollection()).distinct('region');
  return regions.sort((a, b) => a.localeCompare(b, 'vi'));
}

export async function updatePlace(id: string, input: z.output<typeof placeUpdateSchema>) {
  const doc = await (
    await placesCollection()
  ).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!doc) throw new HttpError(404, 'Không tìm thấy địa điểm.');
  // Đổi category/tags có thể làm thay đổi tiện ích suy ra.
  if (input.category !== undefined || input.tags !== undefined) {
    doc.amenities = await refreshPlaceAmenities(await getMongo(), doc._id);
  }
  await cache.invalidate();
  const updated = toPlace(doc);
  await syncPlaceGraph(updated).catch((err) => console.error('Lỗi đồng bộ Place sang Neo4j:', err));
  return updated;
}

// Xóa địa điểm kèm dữ liệu con (khách sạn, nhà hàng, dịch vụ, đánh giá) để không bị mồ côi.
export async function deletePlace(id: string) {
  const db = await getMongo();
  const placeId = new ObjectId(id);
  const result = await db.collection('places').deleteOne({ _id: placeId });
  if (result.deletedCount === 0) throw new HttpError(404, 'Không tìm thấy địa điểm.');
  await Promise.all(
    ['hotels', 'restaurants', 'services', 'reviews'].map((name) =>
      db.collection(name).deleteMany({ placeId }),
    ),
  );
  await deletePlaceNode(id).catch((err) => console.error('Lỗi xóa Place khỏi Neo4j:', err));
  await cache.invalidate();
}
