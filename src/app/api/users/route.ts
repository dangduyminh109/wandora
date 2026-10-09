import { NextResponse } from 'next/server';
import { assertSameOrigin, handleApi, HttpError, parseJson } from '@/lib/http';
import { requireUser } from '@/features/auth/server/session';
import { createUserSchema, usersQuerySchema } from '@/features/users/schemas';
import { listUsers } from '@/features/users/server/list-users';
import { createUser } from '@/features/auth/server/users';
export async function GET(request: Request) {
  return handleApi(async () => {
    await requireUser(true);
    const query = usersQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await listUsers(query));
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    await requireUser(true);
    const input = createUserSchema.parse(await parseJson(request));
    try {
      return NextResponse.json({ user: await createUser(input) }, { status: 201 });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed'
      )
        throw new HttpError(409, 'Email đã được sử dụng.');
      throw error;
    }
  });
}
