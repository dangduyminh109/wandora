import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi } from '@/lib/http';
import { endSession } from '@/features/auth/server/session';
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await endSession();
    return NextResponse.json({ ok: true });
  });
}
