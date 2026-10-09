import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertSameOrigin, handleApi, parseJson, HttpError } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
import { findUser, publicUser } from '@/features/auth/server/users';
import { updateUserSchema } from '@/features/account/schemas';
import { updateUser } from '@/features/account/server/accounts';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return handleApi(async () => {
    await requireUser(true);
    const id = z.uuid().parse((await context.params).id);
    const user = await findUser('id', id);
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản.');
    return NextResponse.json({ user: publicUser(user) });
  });
}
export async function PATCH(request: Request, context: Context) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const actor = await requireUser(true);
    const id = z.uuid().parse((await context.params).id);
    return NextResponse.json({
      user: await updateUser(actor, id, updateUserSchema.parse(await parseJson(request))),
    });
  });
}
