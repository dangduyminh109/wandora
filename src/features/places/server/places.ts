import 'server-only';
import { ObjectId, type Filter, type Sort, type WithId } from 'mongodb';
import type { z } from 'zod';
import { cache, CACHE_TTL_SECONDS } from '@/lib/cache';
import { getMongo } from '@/lib/db/mongodb';
import { HttpError } from '@/lib/http';
import { slugify } from '@/lib/slug';
import type { placeInputSchema, placeUpdateSchema, placesQuerySchema } from '../schemas';
import type { Place } from '../types';

type PlaceDoc = Omit<Place, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

async function placesCollection() {
  return (await getMongo()).collection<PlaceDoc>('places');
}

function toPlace(doc: WithId<PlaceDoc>): Place {
  const { _id, createdAt, updatedAt, ...rest } = doc;
  delete (rest as { score?: number }).score; // điểm $text chỉ dùng để sắp xếp, không trả ra ngoài
  return {
    ...rest,
    id: _id.toHexString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
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
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const { insertedId } = await collection.insertOne(doc);
      await cache.invalidate();
      return toPlace({ ...doc, _id: insertedId });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
  throw new HttpError(409, 'Không tạo được đường dẫn (slug) duy nhất cho địa điểm.');
}

export async function listPlaces(query: z.output<typeof placesQuerySchema>) {
  const collection = await placesCollection();
  const filter: Filter<PlaceDoc> = {};
  if (query.search) filter.$text = { $search: query.search };
  if (query.category) filter.category = query.category;
  if (query.region) filter.region = query.region;
  // Tìm theo một phần tên, không phân biệt dấu (so khớp trên slug), dùng cho ô chọn địa điểm.
  const fragment = slugify(query.nameContains);
  if (fragment) filter.slug = { $regex: fragment };
  if (query.minRating > 0) filter.ratingAvg = { $gte: query.minRating };
  // Sắp xếp theo độ liên quan chỉ có nghĩa khi đang tìm kiếm; nếu không thì quay về mới nhất.
  const byRelevance = query.sortBy === 'relevance' && !!query.search;
  const sort: Sort = byRelevance
    ? { score: { $meta: 'textScore' }, _id: 1 }
    : {
        [query.sortBy === 'relevance' ? 'createdAt' : query.sortBy]:
          query.direction === 'asc' ? 1 : -1,
        _id: 1,
      };
  const [docs, total] = await Promise.all([
    collection
      .find(filter, byRelevance ? { projection: { score: { $meta: 'textScore' } } } : undefined)
      .sort(sort)
      .skip(query.page * query.pageSize)
      .limit(query.pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);
  return { places: docs.map(toPlace), total };
}

// Tìm kiếm có cache Redis. `useCache: false` dùng để đo thời gian khi không có cache.
export async function searchPlaces(
  query: z.output<typeof placesQuerySchema>,
  options: { useCache?: boolean } = {},
) {
  if (options.useCache === false) return { value: await listPlaces(query), hit: false };
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
  await cache.invalidate();
  return toPlace(doc);
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
  await cache.invalidate();
}
