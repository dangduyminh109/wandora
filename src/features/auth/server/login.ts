import 'server-only';
import { getRedis } from '@/lib/db/redis';
import { HttpError } from '@/lib/http';
import { loginSchema } from '../schemas';
import { findUser, publicUser } from './users';
import { hashPassword, verifyPassword } from './password';
import { startSession } from './session';
import { LOGIN_WINDOW_SECONDS, loginBuckets } from './login-limits';
const dummyHash = hashPassword('wandora-timing-padding');
export async function login(input: unknown, ip?: string | null) {
  const data = loginSchema.parse(input);
  const redis = await getRedis();
  const buckets = loginBuckets(data.email, ip);
  const counts = (await redis.eval(
    "local r = {} for i, k in ipairs(KEYS) do local n = redis.call('INCR', k) if n == 1 then redis.call('EXPIRE', k, ARGV[1]) end r[i] = n end return r",
    { keys: buckets.map((bucket) => bucket.key), arguments: [String(LOGIN_WINDOW_SECONDS)] },
  )) as number[];
  if (buckets.some((bucket, index) => Number(counts[index]) > bucket.limit))
    throw new HttpError(429, 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.');
  const user = await findUser('email', data.email);
  const valid = await verifyPassword(data.password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid || user.status === 'locked')
    throw new HttpError(401, 'Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.');
  await startSession(publicUser(user), user.authVersion ?? 'legacy');
  const clear = buckets.filter((bucket) => bucket.clearOnSuccess).map((bucket) => bucket.key);
  if (clear.length) await redis.del(clear);
  return publicUser(user);
}
