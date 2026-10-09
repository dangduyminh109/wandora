import 'server-only';
import { createHash } from 'node:crypto';
import { getRedis } from '@/lib/db/redis';
import { HttpError } from '@/lib/http';
import { loginSchema } from '../schemas';
import { findUser, publicUser } from './users';
import { hashPassword, verifyPassword } from './password';
import { startSession } from './session';
const dummyHash = hashPassword('wandora-timing-padding');
export async function login(input: unknown) {
  const data = loginSchema.parse(input);
  const redis = await getRedis();
  const rateKey = `wandora:login:${createHash('sha256').update(data.email).digest('hex')}`;
  const count = await redis.eval(
    "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], 900) end; return count",
    { keys: [rateKey], arguments: [] },
  );
  if (Number(count) > 10)
    throw new HttpError(429, 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.');
  const user = await findUser('email', data.email);
  const valid = await verifyPassword(data.password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid || user.status === 'locked')
    throw new HttpError(401, 'Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.');
  await startSession(publicUser(user), user.authVersion ?? 'legacy');
  await redis.del(rateKey);
  return publicUser(user);
}
