import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi } from '@/lib/http';
import { rotateSession } from '@/features/auth/server/session';
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    return NextResponse.json({ user: await rotateSession() });
  });
}
