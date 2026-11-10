import { closeMongo, getMongo } from '../src/lib/db/mongodb';
import { refreshAllPlaceAmenities } from '../src/features/places/server/amenity-sync';

// Tính lại trường `amenities` cho mọi địa điểm từ khách sạn, nhà hàng, dịch vụ, category và tags.
// Chạy lại nhiều lần vẫn an toàn (kết quả chỉ phụ thuộc vào dữ liệu hiện có).
async function main() {
  const db = await getMongo();
  const count = await refreshAllPlaceAmenities(db);
  console.log(`Đã cập nhật tiện ích cho ${count} địa điểm`);
  const stats = await db
    .collection('places')
    .aggregate([
      { $unwind: '$amenities' },
      { $group: { _id: '$amenities', places: { $sum: 1 } } },
      { $sort: { places: -1 } },
    ])
    .toArray();
  for (const row of stats) console.log(`  ${row._id}: ${row.places} địa điểm`);
}
main()
  .catch((error) => {
    console.error('Cập nhật tiện ích thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(closeMongo);
