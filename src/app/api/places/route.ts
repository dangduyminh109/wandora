import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
import { placeInputSchema, placesQuerySchema } from '@/features/places/schemas';
import { createPlace, searchPlaces } from '@/features/places/server/places';

export async function GET(request: Request) {
  return handleApi(async () => {
    await requireUser();
    const query = placesQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const { value, hit } = await searchPlaces(query);
    return NextResponse.json(value, { headers: { 'X-Cache': hit ? 'HIT' : 'MISS' } });
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireUser(true);
    const input = placeInputSchema.parse(await parseJson(request));
    return NextResponse.json({ place: await createPlace(input) }, { status: 201 });
  });
}
