import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
import { profileSchema } from '@/features/account/schemas';
import { updateProfile } from '@/features/account/server/accounts';
export async function GET() {
  return handleApi(async () => NextResponse.json({ user: await requireUser() }));
}
export async function PATCH(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    return NextResponse.json({
      user: await updateProfile(user, profileSchema.parse(await parseJson(request))),
    });
  });
}
