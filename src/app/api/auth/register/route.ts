import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { register } from '@/features/auth/server/register';
import { clientIp } from '@/features/auth/server/login-limits';

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await register(await parseJson(request), clientIp(request.headers));
    return NextResponse.json(
      { message: 'Đăng ký thành công. Bạn có thể đăng nhập ngay.' },
      { status: 201 },
    );
  });
}
