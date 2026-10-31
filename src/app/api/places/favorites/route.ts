import { NextResponse } from 'next/server';
import { handleApi } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
import { listUserFavorites } from '@/features/places/server/favorites';
import { reviewsQuerySchema } from '@/features/places/review-schemas';

export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const query = reviewsQuerySchema.parse({
      page: searchParams.get('page') ?? 0,
      pageSize: searchParams.get('pageSize') ?? 12,
    });
    const result = await listUserFavorites(user.id, query.page, query.pageSize);
    return NextResponse.json(result);
  });
}
