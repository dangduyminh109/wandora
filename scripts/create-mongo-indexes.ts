import { closeMongo, getMongo } from '../src/lib/db/mongodb';

async function main() {
  const db = await getMongo();
  await db.collection('places').createIndexes([
    { key: { slug: 1 }, name: 'places_slug_unique', unique: true },
    {
      key: { name: 'text', description: 'text', tags: 'text' },
      name: 'places_text',
      default_language: 'none',
    },
    { key: { location: '2dsphere' }, name: 'places_geo' },
    { key: { category: 1, region: 1 }, name: 'places_category_region' },
    { key: { ratingAvg: -1 }, name: 'places_rating' },
  ]);
  await db.collection('hotels').createIndexes([
    { key: { slug: 1 }, name: 'hotels_slug_unique', unique: true },
    { key: { placeId: 1 }, name: 'hotels_place' },
    { key: { priceLevel: 1 }, name: 'hotels_price' },
  ]);
  await db.collection('restaurants').createIndexes([
    { key: { slug: 1 }, name: 'restaurants_slug_unique', unique: true },
    { key: { placeId: 1 }, name: 'restaurants_place' },
    { key: { priceLevel: 1 }, name: 'restaurants_price' },
  ]);
  await db.collection('services').createIndexes([
    { key: { slug: 1 }, name: 'services_slug_unique', unique: true },
    { key: { placeId: 1 }, name: 'services_place' },
    { key: { type: 1 }, name: 'services_type' },
  ]);
  await db.collection('reviews').createIndexes([
    { key: { placeId: 1, createdAt: -1 }, name: 'reviews_place_time' },
    { key: { placeId: 1, userId: 1 }, name: 'reviews_one_per_user', unique: true },
  ]);
  console.log('MongoDB indexes ready');
}
main()
  .catch((error) => {
    console.error('Index creation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(closeMongo);
