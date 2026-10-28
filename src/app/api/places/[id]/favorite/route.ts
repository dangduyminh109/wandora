import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi } from '@/lib/http';
import { currentUser, requireUser } from '@/features/auth/server/session';
import { placeIdSchema } from '@/features/places/schemas';
import {
  getPlaceFavoriteCount,
  isPlaceFavorited,
  toggleFavorite,
} from '@/features/places/server/favorites';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return handleApi(async () => {
    const id = placeIdSchema.parse((await context.params).id);
    const user = await currentUser();
    const [favorited, count] = await Promise.all([
      user ? isPlaceFavorited(user.id, id) : false,
      getPlaceFavoriteCount(id),
    ]);
    return NextResponse.json({ favorited, count });
  });
}

export async function POST(request: Request, context: Context) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const id = placeIdSchema.parse((await context.params).id);
    const result = await toggleFavorite(user.id, id);
    const count = await getPlaceFavoriteCount(id);
    return NextResponse.json({ ...result, count });
  });
}
