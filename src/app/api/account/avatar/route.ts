import { NextResponse } from 'next/server';
import { requireUser } from '@/features/auth/server/session';
import { updateAvatar } from '@/features/account/server/accounts';
import { assertSameOrigin, handleApi, HttpError } from '@/lib/http';
import { getRedis } from '@/lib/db/redis';
import { ImageUploadError, readImageForm, storeImage } from '@/features/places/server/image-upload';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const count = await (
      await getRedis()
    ).eval(
      "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 900) end; return n",
      { keys: [`wandora:avatar:${user.id}`], arguments: [] },
    );
    if (Number(count) > 20)
      throw new HttpError(429, 'Bạn đã đổi ảnh quá nhiều lần. Thử lại sau 15 phút.');
    try {
      const image = await storeImage(await readImageForm(request));
      return NextResponse.json({ user: await updateAvatar(user, image.url) });
    } catch (error) {
      if (error instanceof ImageUploadError) throw new HttpError(error.status, error.message);
      throw error;
    }
  });
}

export async function DELETE(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    return NextResponse.json({ user: await updateAvatar(await requireUser(), '') });
  });
}
