import 'server-only';
import { randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { publicUser } from '@/features/auth/server/users';
import { hashPassword, verifyPassword } from '@/features/auth/server/password';
import { HttpError } from '@/lib/http';
import { getRedis } from '@/lib/db/redis';
import type { User } from '@/types/user';
import { changePasswordSchema, editUserSchema, profileSchema, updateUserSchema } from '../schemas';
import { accountTransaction, transactionUser } from './transaction';

export async function updateProfile(actor: User, input: z.output<typeof profileSchema>) {
  return accountTransaction(async (tx) => {
    const user = await transactionUser(tx, actor.id);
    if (user.status === 'locked') throw new HttpError(401, 'Tài khoản đã bị khóa.');
    const result = await tx.run('MATCH (u:User {id: $id}) SET u += $profile RETURN u', {
      id: actor.id,
      profile: input,
    });
    return publicUser(result.records[0].get('u').properties);
  });
}
export async function updateAvatar(actor: User, avatar: string) {
  return accountTransaction(async (tx) => {
    const user = await transactionUser(tx, actor.id);
    if (user.status === 'locked') throw new HttpError(401, 'Tài khoản đã bị khóa.');
    const result = await tx.run('MATCH (u:User {id: $id}) SET u.avatar = $avatar RETURN u', {
      id: actor.id,
      avatar,
    });
    return publicUser(result.records[0].get('u').properties);
  });
}
export async function changePassword(actor: User, input: z.output<typeof changePasswordSchema>) {
  const rateKey = `wandora:change-password:${actor.id}`;
  const redis = await getRedis();
  const count = await redis.eval(
    "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 900) end; return n",
    { keys: [rateKey], arguments: [] },
  );
  if (Number(count) > 10) throw new HttpError(429, 'Thử lại sau 15 phút.');
  const passwordHash = await hashPassword(input.password);
  await accountTransaction(async (tx) => {
    const user = await transactionUser(tx, actor.id);
    if (user.status === 'locked') throw new HttpError(401, 'Tài khoản đã bị khóa.');
    if (!(await verifyPassword(input.currentPassword, user.passwordHash)))
      throw new HttpError(400, 'Mật khẩu hiện tại không đúng.');
    await tx.run(
      'MATCH (u:User {id: $id}) SET u.passwordHash = $passwordHash, u.authVersion = $version REMOVE u.resetTokenHash, u.resetExpiresAt',
      { id: actor.id, passwordHash, version: randomUUID() },
    );
  });
  await redis.del(rateKey);
}
export async function updateUser(
  actor: User,
  id: string,
  changes: z.output<typeof updateUserSchema>,
) {
  return accountTransaction(async (tx) => {
    const administrator = await transactionUser(tx, actor.id);
    if (administrator.role !== 'admin' || administrator.status === 'locked')
      throw new HttpError(403, 'Bạn không có quyền quản lý tài khoản.');
    const target = await transactionUser(tx, id);
    const input = editUserSchema.parse({
      ...target,
      status: target.status ?? 'active',
      ...changes,
    });
    if (actor.id === id && (input.status === 'locked' || input.role !== 'admin'))
      throw new HttpError(400, 'Bạn không thể tự khóa hoặc tự hạ quyền tài khoản.');
    if (
      target.role === 'admin' &&
      target.status !== 'locked' &&
      (input.role !== 'admin' || input.status === 'locked')
    ) {
      const count = await tx.run(
        "MATCH (u:User) WHERE u.role = 'admin' AND coalesce(u.status, 'active') = 'active' RETURN count(u) AS count",
      );
      if (count.records[0].get('count').toNumber() <= 1)
        throw new HttpError(400, 'Cần giữ ít nhất một quản trị viên hoạt động.');
    }
    const sensitive =
      target.email !== input.email ||
      target.role !== input.role ||
      (target.status ?? 'active') !== input.status;
    const result = await tx.run('MATCH (u:User {id: $id}) SET u += $input RETURN u', {
      id,
      input: { ...input, ...(sensitive ? { authVersion: randomUUID() } : {}) },
    });
    if (sensitive)
      await tx.run('MATCH (u:User {id: $id}) REMOVE u.resetTokenHash, u.resetExpiresAt', { id });
    return publicUser(result.records[0].get('u').properties);
  });
}
