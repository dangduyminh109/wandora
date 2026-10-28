import { NextResponse } from 'next/server';
import { handleApi } from '@/lib/http';
import { placeIdSchema } from '@/features/places/schemas';
import { getRelatedPlaces } from '@/features/recommendations/server/recommendations';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return handleApi(async () => {
    const id = placeIdSchema.parse((await context.params).id);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(10, Math.max(1, Number(searchParams.get('limit') ?? 4)));
    const related = await getRelatedPlaces(id, limit);
    return NextResponse.json({ places: related });
  });
}
