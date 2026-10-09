import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { int } from 'neo4j-driver';
import type { z } from 'zod';
import { getEnv } from '@/config/env';
import { getRedis } from '@/lib/db/redis';
import { HttpError } from '@/lib/http';
import { mailTransport, passwordChangedMail } from '@/lib/mail';
import { digestToken } from '@/features/auth/server/session';
import { hashPassword, verifyPassword } from '@/features/auth/server/password';
import { resetPasswordSchema } from '../schemas';
import { accountTransaction } from './transaction';
export const RECOVERY_MESSAGE =
  'Nếu email thuộc một tài khoản hoạt động, bạn sẽ nhận được link đặt lại mật khẩu. Kiểm tra cả thư mục spam.';
export async function requestPasswordReset(email: string) {
  const started = Date.now();
  try {
    const redis = await getRedis();
    const increment = (key: string, seconds: number) =>
      redis.eval(
        "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n",
        { keys: [key], arguments: [String(seconds)] },
      );
    if (Number(await increment('wandora:recovery:global', 3600)) > 100)
      throw new HttpError(429, 'Vui lòng thử lại sau.');
    if (Number(await increment(`wandora:recovery:${digestToken(email)}`, 900)) > 5) return;
    const { from, transport } = mailTransport();
    try {
      // Check delivery availability for all requests, including unknown addresses.
      await transport.verify();
      const token = randomBytes(32).toString('hex');
      const tokenHash = digestToken(token);
      const user = await accountTransaction(async (tx) => {
        const result = await tx.run(
          "MATCH (u:User {email: $email}) WHERE coalesce(u.status, 'active') = 'active' SET u.resetTokenHash = $hash, u.resetExpiresAt = $expires RETURN u.id AS id",
          { email, hash: tokenHash, expires: int(Date.now() + 15 * 60 * 1000) },
        );
        return result.records[0]?.get('id') as string | undefined;
      });
      if (user) {
        const link = new URL('/reset-password', getEnv().APP_URL);
        link.hash = `token=${token}`;
        try {
          await transport.sendMail({
            from,
            to: email,
            subject: 'Wandora — Đặt lại mật khẩu',
            text: `Bạn đã yêu cầu đặt lại mật khẩu Wandora. Link có hiệu lực 15 phút và chỉ dùng một lần:\n\n${link.toString()}\n\nNếu không phải bạn yêu cầu, hãy bỏ qua email này.`,
          });
        } catch {
          await accountTransaction(async (tx) => {
            await tx.run(
              'MATCH (u:User {id: $id, resetTokenHash: $hash}) REMOVE u.resetTokenHash, u.resetExpiresAt',
              { id: user, hash: tokenHash },
            );
          });
          throw new HttpError(503, 'Không thể gửi email lúc này. Vui lòng thử lại sau.');
        }
      }
    } finally {
      transport.close();
    }
  } finally {
    await setTimeout(Math.max(0, 800 - (Date.now() - started)));
  }
}
export async function resetPassword(input: z.output<typeof resetPasswordSchema>) {
  const redis = await getRedis();
  const attempts = await redis.eval(
    "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 3600) end; return n",
    { keys: ['wandora:reset:global'], arguments: [] },
  );
  if (Number(attempts) > 100)
    throw new HttpError(429, 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.');
  const passwordHash = await hashPassword(input.password);
  const email = await accountTransaction(async (tx) => {
    const result = await tx.run(
      "MATCH (u:User {resetTokenHash: $hash}) WHERE u.resetExpiresAt > $now AND coalesce(u.status, 'active') = 'active' RETURN u",
      { hash: digestToken(input.token), now: int(Date.now()) },
    );
    if (!result.records.length)
      throw new HttpError(400, 'Link không hợp lệ hoặc đã hết hạn. Hãy yêu cầu link mới.');
    const user = result.records[0].get('u').properties;
    if (await verifyPassword(input.password, user.passwordHash))
      throw new HttpError(400, 'Mật khẩu mới phải khác mật khẩu hiện tại.');
    await tx.run(
      'MATCH (u:User {id: $id}) SET u.passwordHash = $passwordHash, u.authVersion = $version REMOVE u.resetTokenHash, u.resetExpiresAt',
      { id: user.id, passwordHash, version: randomUUID() },
    );
    return user.email as string;
  });
  await passwordChangedMail(email);
}
