import 'server-only';
import { createHash } from 'node:crypto';
import { getRedis } from '@/lib/db/redis';
import { HttpError } from '@/lib/http';
import { registerSchema } from '../schemas';
import { createUser } from './users';

export async function register(input: unknown, ip?: string | null) {
  const data = registerSchema.parse(input);
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');
  const keys = [
    `wandora:register:email:${digest(data.email)}`,
    ip ? `wandora:register:ip:${digest(ip)}` : 'wandora:register:local',
  ];
  const counts = (await (
    await getRedis()
  ).eval(
    "local r = {} for i, k in ipairs(KEYS) do local n = redis.call('INCR', k) if n == 1 then redis.call('EXPIRE', k, 900) end r[i] = n end return r",
    { keys, arguments: [] },
  )) as number[];
  if (Number(counts[0]) > 5 || Number(counts[1]) > 20)
    throw new HttpError(429, 'Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút.');

  try {
    // Never accept role/status from a public request, even if the caller includes them.
    await createUser({ name: data.name, email: data.email, password: data.password, role: 'user' });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed'
    )
      throw new HttpError(409, 'Email đã được sử dụng. Hãy đăng nhập hoặc dùng email khác.');
    throw error;
  }
}
