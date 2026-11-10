import { NextResponse } from 'next/server';
import { handleApi } from '@/lib/http';
import { amenitySearchQuerySchema } from '@/features/places/schemas';
import { searchPlacesByAmenities } from '@/features/places/server/amenity-search';

export async function GET(request: Request) {
  return handleApi(async () => {
    const query = amenitySearchQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const { value, hit } = await searchPlacesByAmenities(query);
    return NextResponse.json(value, { headers: { 'X-Cache': hit ? 'HIT' : 'MISS' } });
  });
}
