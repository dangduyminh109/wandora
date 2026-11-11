import { NextResponse } from 'next/server';
import { requireUser } from '@/features/auth/server/session';
import { recentlyViewedPlaces } from '@/features/activity/server/recent-places';
import { handleApi } from '@/lib/http';

export async function GET() {
  return handleApi(async () => {
    const user = await requireUser();
    return NextResponse.json(await recentlyViewedPlaces(user.id), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  });
}
