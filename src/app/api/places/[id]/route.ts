import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, parseJson } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
import { placeIdSchema, placeUpdateSchema } from '@/features/places/schemas';
import { deletePlace, getPlace, updatePlace } from '@/features/places/server/places';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return handleApi(async () => {
    const id = placeIdSchema.parse((await context.params).id);
    return NextResponse.json({ place: await getPlace(id) });
  });
}

export async function PATCH(request: Request, context: Context) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireUser(true);
    const id = placeIdSchema.parse((await context.params).id);
    const input = placeUpdateSchema.parse(await parseJson(request));
    return NextResponse.json({ place: await updatePlace(id, input) });
  });
}

export async function DELETE(request: Request, context: Context) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireUser(true);
    const id = placeIdSchema.parse((await context.params).id);
    await deletePlace(id);
    return NextResponse.json({ ok: true });
  });
}
