import 'server-only';
import { ObjectId, type Document, type Filter, type Sort, type WithId } from 'mongodb';
import type { z } from 'zod';
import { cache } from '@/lib/cache';
import { getMongo } from '@/lib/db/mongodb';
import { HttpError } from '@/lib/http';
import { slugify } from '@/lib/slug';
import { refreshPlaceAmenities } from '@/features/places/server/amenity-sync';
import { syncPlaceAmenityEdges } from '@/features/places/server/amenity-graph';
import type { catalogQuerySchema } from '../schemas';

export type CatalogItem<T extends { name: string; placeId: string }> = T & {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type CatalogRepository<T extends { name: string; placeId: string }> = ReturnType<
  typeof createCatalogRepository<T>
>;

const isDuplicateKey = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
// Tính lại tiện ích của địa điểm rồi cập nhật đồ thị. Neo4j lỗi chỉ ghi log: MongoDB mới là nguồn đúng,
// chạy `npm run db:sync-neo4j` để đồng bộ lại.
async function refreshAmenities(placeId: ObjectId | string) {
  const id = typeof placeId === 'string' ? placeId : placeId.toHexString();
  const amenities = await refreshPlaceAmenities(await getMongo(), id);
  await syncPlaceAmenityEdges([{ id, amenities }]).catch((err) =>
    console.error('Lỗi đồng bộ tiện ích sang Neo4j:', err),
  );
}
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Repository dùng chung cho hotels, restaurants, services (cùng cấu trúc: placeId, name, slug…).
export function createCatalogRepository<T extends { name: string; placeId: string }>(
  collectionName: string,
  fallbackSlug: string,
) {
  async function collection() {
    return (await getMongo()).collection(collectionName);
  }

  function toItem(doc: WithId<Document>) {
    const { _id, placeId, createdAt, updatedAt, ...rest } = doc;
    return {
      ...rest,
      id: _id.toHexString(),
      placeId: (placeId as ObjectId).toHexString(),
      createdAt: (createdAt as Date).toISOString(),
      updatedAt: (updatedAt as Date).toISOString(),
    } as unknown as CatalogItem<T>;
  }

  async function ensurePlace(placeId: string) {
    const place = await (
      await getMongo()
    )
      .collection('places')
      .findOne({ _id: new ObjectId(placeId) }, { projection: { _id: 1 } });
    if (!place) throw new HttpError(404, 'Không tìm thấy địa điểm.');
  }

  return {
    async create(input: T) {
      await ensurePlace(input.placeId);
      const col = await collection();
      const base = slugify(input.name) || fallbackSlug;
      const now = new Date();
      for (let attempt = 1; attempt <= 20; attempt++) {
        const doc: Document = {
          ...input,
          placeId: new ObjectId(input.placeId),
          slug: attempt === 1 ? base : `${base}-${attempt}`,
          createdAt: now,
          updatedAt: now,
        };
        try {
          const { insertedId } = await col.insertOne(doc);
          await refreshAmenities(input.placeId);
          await cache.invalidate();
          return toItem({ ...doc, _id: insertedId });
        } catch (error) {
          if (!isDuplicateKey(error)) throw error;
        }
      }
      throw new HttpError(409, 'Không tạo được đường dẫn (slug) duy nhất.');
    },

    async list(query: z.output<typeof catalogQuerySchema>) {
      const col = await collection();
      const filter: Filter<Document> = {};
      if (query.search) filter.name = { $regex: escapeRegExp(query.search), $options: 'i' };
      if (query.placeId) filter.placeId = new ObjectId(query.placeId);
      const sort: Sort = { [query.sortBy]: query.direction === 'asc' ? 1 : -1, _id: 1 };
      const [docs, total] = await Promise.all([
        col
          .find(filter)
          .sort(sort)
          .skip(query.page * query.pageSize)
          .limit(query.pageSize)
          .toArray(),
        col.countDocuments(filter),
      ]);
      // Kèm tên địa điểm để giao diện quản trị hiển thị mà không phải gọi thêm API.
      const ids = [...new Set(docs.map((doc) => (doc.placeId as ObjectId).toHexString()))];
      const places = ids.length
        ? await (
            await getMongo()
          )
            .collection('places')
            .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { name: 1 } })
            .toArray()
        : [];
      const placeNames = Object.fromEntries(
        places.map((place) => [place._id.toHexString(), place.name as string]),
      );
      return { items: docs.map(toItem), total, placeNames };
    },

    async get(id: string) {
      const doc = await (await collection()).findOne({ _id: new ObjectId(id) });
      if (!doc) throw new HttpError(404, 'Không tìm thấy dữ liệu.');
      return toItem(doc);
    },

    async update(id: string, patch: Partial<T>) {
      const set: Document = { ...patch, updatedAt: new Date() };
      if (patch.placeId) {
        await ensurePlace(patch.placeId);
        set.placeId = new ObjectId(patch.placeId);
      }
      const col = await collection();
      // Nếu chuyển sang địa điểm khác, địa điểm cũ cũng phải tính lại tiện ích.
      const before = patch.placeId
        ? await col.findOne({ _id: new ObjectId(id) }, { projection: { placeId: 1 } })
        : null;
      const doc = await col.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: set },
        { returnDocument: 'after' },
      );
      if (!doc) throw new HttpError(404, 'Không tìm thấy dữ liệu.');
      await refreshAmenities(doc.placeId as ObjectId);
      if (before && !(before.placeId as ObjectId).equals(doc.placeId as ObjectId))
        await refreshAmenities(before.placeId as ObjectId);
      await cache.invalidate();
      return toItem(doc);
    },

    async remove(id: string) {
      const col = await collection();
      const removed = await col.findOneAndDelete(
        { _id: new ObjectId(id) },
        { projection: { placeId: 1 } },
      );
      if (!removed) throw new HttpError(404, 'Không tìm thấy dữ liệu.');
      await refreshAmenities(removed.placeId as ObjectId);
      await cache.invalidate();
    },
  };
}
