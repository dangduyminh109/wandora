import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { forgotPasswordSchema } from '@/features/account/schemas';
import { requestPasswordReset, RECOVERY_MESSAGE } from '@/features/account/server/recovery';
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const { email } = forgotPasswordSchema.parse(await parseJson(request));
    await requestPasswordReset(email);
    return NextResponse.json({ message: RECOVERY_MESSAGE });
  });
}
