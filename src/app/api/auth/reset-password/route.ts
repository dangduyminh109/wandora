import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { endSession } from '@/features/auth/server/session';
import { resetPasswordSchema } from '@/features/account/schemas';
import { resetPassword } from '@/features/account/server/recovery';
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await resetPassword(resetPasswordSchema.parse(await parseJson(request)));
    await endSession();
    return NextResponse.json({ message: 'Đã đặt lại mật khẩu. Vui lòng đăng nhập.' });
  });
}
