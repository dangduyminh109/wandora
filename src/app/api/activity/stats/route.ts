import { NextResponse } from 'next/server';
import { requireUser } from '@/features/auth/server/session';
import { statsQuerySchema } from '@/features/activity/schemas';
import { activityStats } from '@/features/activity/server/activity';
import { handleApi } from '@/lib/http';
export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const { days } = statsQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await activityStats(user.id, days));
  });
}
