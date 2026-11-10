import type { Document } from 'mongodb';
import { ObjectId } from 'mongodb';
import { closeMongo, getMongo } from '../src/lib/db/mongodb';
import { slugify } from '../src/lib/slug';
import { refreshAllPlaceAmenities } from '../src/features/places/server/amenity-sync';
import { buildSeed } from './seed-data/generate';

// Chạy lại nhiều lần vẫn an toàn: mỗi bản ghi được upsert theo slug, không tạo bản sao.
// `--reset` xóa TOÀN BỘ places/hotels/restaurants/services/reviews trước khi nạp.
async function main() {
  const db = await getMongo();
  if (process.argv.includes('--reset')) {
    for (const name of ['places', 'hotels', 'restaurants', 'services', 'reviews']) {
      const { deletedCount } = await db.collection(name).deleteMany({});
      console.log(`Đã xóa ${deletedCount} bản ghi trong ${name}`);
    }
  }

  const now = new Date();
  const totals = { places: 0, hotels: 0, restaurants: 0, services: 0 };
  const data = buildSeed();

  for (const item of data) {
    const placeResult = await db.collection('places').findOneAndUpdate(
      { slug: item.slug },
      {
        $setOnInsert: {
          ...item.place,
          slug: item.slug,
          ratingAvg: item.ratingAvg,
          ratingCount: item.ratingCount,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );
    const placeId = (placeResult as { _id: ObjectId })._id;
    totals.places++;

    for (const kind of ['hotels', 'restaurants', 'services'] as const) {
      const operations = item[kind].map((child: Document & { name: string }) => ({
        updateOne: {
          filter: { slug: slugify(child.name) },
          update: {
            $setOnInsert: {
              ...child,
              placeId,
              slug: slugify(child.name),
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      }));
      if (operations.length) await db.collection(kind).bulkWrite(operations, { ordered: false });
      totals[kind] += operations.length;
    }
  }

  // Tiện ích suy ra từ dữ liệu con nên phải tính sau khi nạp xong (cũng sửa luôn các bản ghi seed cũ).
  await refreshAllPlaceAmenities(db);

  console.log('Đã nạp dữ liệu mẫu:', totals);
  for (const name of ['places', 'hotels', 'restaurants', 'services']) {
    console.log(`  ${name}: ${await db.collection(name).countDocuments()} bản ghi trong CSDL`);
  }
}
main()
  .catch((error) => {
    console.error('Nạp dữ liệu thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(closeMongo);
