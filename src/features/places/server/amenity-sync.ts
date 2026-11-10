import { ObjectId, type Db } from 'mongodb';
import { deriveAmenities } from '../amenities';

// Không import 'server-only' để script (tsx) dùng chung được với route handler.

async function amenitiesOf(db: Db, placeId: ObjectId, place: { category: string; tags: string[] }) {
  const [hotels, restaurants, services] = await Promise.all([
    db
      .collection('hotels')
      .find({ placeId }, { projection: { amenities: 1 } })
      .toArray(),
    db
      .collection('restaurants')
      .find({ placeId }, { projection: { cuisine: 1 } })
      .toArray(),
    db
      .collection('services')
      .find({ placeId }, { projection: { type: 1 } })
      .toArray(),
  ]);
  return deriveAmenities({
    place,
    hotels: hotels as { amenities?: string[] }[],
    restaurants: restaurants as { cuisine?: string[] }[],
    services: services as { type?: string }[],
  });
}

// Tính lại `amenities` cho một địa điểm. Gọi sau khi khách sạn/nhà hàng/dịch vụ hoặc category/tags thay đổi.
export async function refreshPlaceAmenities(db: Db, placeId: ObjectId | string) {
  const id = typeof placeId === 'string' ? new ObjectId(placeId) : placeId;
  const place = await db
    .collection('places')
    .findOne({ _id: id }, { projection: { category: 1, tags: 1 } });
  if (!place) return [];
  const amenities = await amenitiesOf(db, id, {
    category: place.category as string,
    tags: (place.tags as string[] | undefined) ?? [],
  });
  await db.collection('places').updateOne({ _id: id }, { $set: { amenities } });
  return amenities;
}

// Tính lại cho toàn bộ địa điểm (dùng khi seed hoặc sau khi đổi quy tắc chuẩn hoá).
export async function refreshAllPlaceAmenities(db: Db) {
  const places = await db
    .collection('places')
    .find({}, { projection: { _id: 1 } })
    .toArray();
  for (const { _id } of places) await refreshPlaceAmenities(db, _id);
  return places.length;
}
