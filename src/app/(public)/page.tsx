import { getMongo } from '@/lib/db/mongodb';
import { PublicHome, type PublicHomeProps } from '@/features/home/components/public-home';

export const revalidate = 60; // Revalidate every minute

async function getLandingData(): Promise<PublicHomeProps> {
  try {
    const db = await getMongo();
    const [placesCount, hotelsCount, restaurantsCount, servicesCount, topPlaces] = await Promise.all([
      db.collection('places').countDocuments(),
      db.collection('hotels').countDocuments(),
      db.collection('restaurants').countDocuments(),
      db.collection('services').countDocuments(),
      db
        .collection('places')
        .find({})
        .sort({ ratingAvg: -1, ratingCount: -1 })
        .limit(6)
        .toArray(),
    ]);

    return {
      stats: {
        places: placesCount || 68,
        hotels: hotelsCount || 267,
        restaurants: restaurantsCount || 206,
        services: servicesCount || 142,
      },
      featuredPlaces: topPlaces.map((doc) => ({
        id: doc._id.toHexString(),
        slug: doc.slug,
        name: doc.name,
        category: doc.category || 'other',
        region: doc.region || '',
        description: doc.description || '',
        ratingAvg: doc.ratingAvg || 0,
        ratingCount: doc.ratingCount || 0,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
      })),
    };
  } catch (error) {
    console.error('Landing DB Error:', error);
    // Graceful fallback if database is cold-starting
    return {
      stats: {
        places: 68,
        hotels: 267,
        restaurants: 206,
        services: 142,
      },
      featuredPlaces: [],
    };
  }
}

export default async function HomePage() {
  const data = await getLandingData();
  return <PublicHome {...data} />;
}
