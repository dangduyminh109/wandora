import 'server-only';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getEnv } from '@/config/env';
import { getRedis } from '@/lib/db/redis';
import { HttpError } from '@/lib/http';
import { findUser, publicUser } from './users';
import type { User } from '@/types/user';
export const ACCESS_SECONDS = 60 * 60;
export const REFRESH_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_COOKIE = 'wandora_access';
const REFRESH_COOKIE = 'wandora_refresh';
export const digestToken = (token: string) => createHash('sha256').update(token).digest('hex');
const key = (sid: string) => `wandora:session:${sid}`;
function secret() {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}
async function writeCookies(userId: string, sid: string, refresh: string) {
  const access = await new SignJWT({ sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer('wandora')
    .setAudience('wandora')
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_SECONDS}s`)
    .sign(secret());
  const jar = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  jar.set(ACCESS_COOKIE, access, { ...options, maxAge: ACCESS_SECONDS });
  jar.set(REFRESH_COOKIE, refresh, { ...options, maxAge: REFRESH_SECONDS });
}
export async function startSession(user: User, authVersion = 'legacy') {
  const sid = randomUUID();
  const refresh = `${sid}.${randomBytes(32).toString('hex')}`;
  await (
    await getRedis()
  ).set(key(sid), JSON.stringify({ userId: user.id, hash: digestToken(refresh), authVersion }), {
    EX: REFRESH_SECONDS,
  });
  await writeCookies(user.id, sid, refresh);
}
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  let claims;
  try {
    claims = (
      await jwtVerify(token, secret(), {
        algorithms: ['HS256'],
        issuer: 'wandora',
        audience: 'wandora',
      })
    ).payload;
  } catch {
    return null;
  }
  if (typeof claims.sid !== 'string' || !claims.sub) return null;
  const stored = await (await getRedis()).get(key(claims.sid));
  if (!stored || JSON.parse(stored).userId !== claims.sub) return null;
  const user = await findUser('id', claims.sub);
  return user &&
    user.status !== 'locked' &&
    (JSON.parse(stored).authVersion ?? 'legacy') === (user.authVersion ?? 'legacy')
    ? publicUser(user)
    : null;
}
export async function requireUser(admin = false) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Vui lòng đăng nhập.');
  if (admin && user.role !== 'admin')
    throw new HttpError(403, 'Bạn không có quyền thực hiện thao tác này.');
  return user;
}
export async function rotateSession() {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh || !/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(refresh))
    throw new HttpError(401, 'Phiên đăng nhập đã hết hạn.');
  const sid = refresh.split('.')[0];
  const redis = await getRedis();
  const stored = await redis.get(key(sid));
  if (!stored || JSON.parse(stored).hash !== digestToken(refresh))
    throw new HttpError(401, 'Phiên đăng nhập không hợp lệ.');
  const user = await findUser('id', JSON.parse(stored).userId);
  if (
    !user ||
    user.status === 'locked' ||
    (JSON.parse(stored).authVersion ?? 'legacy') !== (user.authVersion ?? 'legacy')
  )
    throw new HttpError(401, 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.');
  const replacement = `${sid}.${randomBytes(32).toString('hex')}`;
  const nextValue = JSON.stringify({
    userId: user.id,
    hash: digestToken(replacement),
    authVersion: user.authVersion ?? 'legacy',
  });
  const rotated = await redis.eval(
    "if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3]); return 1 else return 0 end",
    { keys: [key(sid)], arguments: [stored, nextValue, String(REFRESH_SECONDS)] },
  );
  if (rotated !== 1) throw new HttpError(401, 'Phiên đăng nhập đã được làm mới.');
  await writeCookies(user.id, sid, replacement);
  return publicUser(user);
}
export async function endSession() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh && /^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(refresh)) {
    const redis = await getRedis();
    await redis.eval(
      "local value = redis.call('GET', KEYS[1]); if value and cjson.decode(value).hash == ARGV[1] then return redis.call('DEL', KEYS[1]) end; return 0",
      { keys: [key(refresh.split('.')[0])], arguments: [digestToken(refresh)] },
    );
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}
