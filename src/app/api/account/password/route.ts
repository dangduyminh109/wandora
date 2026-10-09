import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { endSession, requireUser } from '@/features/auth/server/session';
import { changePasswordSchema } from '@/features/account/schemas';
import { changePassword } from '@/features/account/server/accounts';
import { passwordChangedMail } from '@/lib/mail';
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    await changePassword(user, changePasswordSchema.parse(await parseJson(request)));
    await endSession();
    await passwordChangedMail(user.email);
    return NextResponse.json({ message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.' });
  });
}
