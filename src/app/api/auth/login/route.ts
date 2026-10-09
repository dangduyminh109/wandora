import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { login } from '@/features/auth/server/login';
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    return NextResponse.json({ user: await login(await parseJson(request)) });
  });
}
