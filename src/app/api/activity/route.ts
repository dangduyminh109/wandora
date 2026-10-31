import { NextResponse } from 'next/server';
import { requireUser } from '@/features/auth/server/session';
import { activityInputSchema, historyQuerySchema } from '@/features/activity/schemas';
import { readHistory, recordActivity } from '@/features/activity/server/activity';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';

export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireUser();
    const query = historyQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await readHistory(user.id, query));
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = activityInputSchema.parse(await parseJson(request));
    return NextResponse.json({ id: await recordActivity(user.id, input) }, { status: 201 });
  });
}
