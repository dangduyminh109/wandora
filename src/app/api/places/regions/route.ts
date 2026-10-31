import { NextResponse } from 'next/server';
import { handleApi } from '@/lib/http';
import { listRegions } from '@/features/places/server/places';

export async function GET() {
  return handleApi(async () => {
    return NextResponse.json({ regions: await listRegions() });
  });
}
