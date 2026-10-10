import { NextResponse } from 'next/server';
import { handleApi } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
import { listRegions } from '@/features/places/server/places';

export async function GET() {
  return handleApi(async () => {
    await requireUser();
    return NextResponse.json({ regions: await listRegions() });
  });
}
