import { NextResponse } from 'next/server';
import { requireUser } from '@/features/auth/server/session';
import { assertSameOrigin, handleApi, HttpError } from '@/lib/http';
import { getRedis } from '@/lib/db/redis';
import { ImageUploadError, readImageForm, storeImage } from '@/features/places/server/image-upload';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireUser(true);
    const count = await (
      await getRedis()
    ).eval(
      "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 900) end; return n",
      { keys: [`wandora:upload:${user.id}`], arguments: [] },
    );
    if (Number(count) > 60)
      throw new HttpError(429, 'Bạn đã tải quá nhiều ảnh. Vui lòng thử lại sau 15 phút.');
    try {
      return NextResponse.json(await storeImage(await readImageForm(request)), { status: 201 });
    } catch (error) {
      if (error instanceof ImageUploadError) throw new HttpError(error.status, error.message);
      throw error;
    }
  });
}
