import { NextResponse } from 'next/server';
import { handleApi } from '@/lib/http';
import { currentUser } from '@/features/auth/server/session';
import {
  getPersonalizedRecommendations,
  getTrendingPlaces,
} from '@/features/recommendations/server/recommendations';

export async function GET(request: Request) {
  return handleApi(async () => {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') ?? 8)));
    const user = await currentUser();

    const [personalized, trending] = await Promise.all([
      user ? getPersonalizedRecommendations(user.id, limit) : null,
      getTrendingPlaces(limit),
    ]);

    return NextResponse.json({
      personalized: personalized?.places ?? [],
      strategy: personalized?.strategy ?? 'trending',
      trending,
    });
  });
}
