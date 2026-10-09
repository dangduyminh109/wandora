import 'server-only';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { getEnv } from '@/config/env';
const mailSchema = z.object({
  SMTP_HOST: z.string().min(1).default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.email().default('no-reply@wandora.local'),
});
export function mailTransport() {
  const env = mailSchema.parse(process.env);
  const local =
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(getEnv().APP_URL).hostname) &&
    ['localhost', '127.0.0.1', '::1'].includes(env.SMTP_HOST);
  return {
    from: env.SMTP_FROM,
    transport: nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === 'true',
      requireTLS: !local && env.SMTP_SECURE !== 'true',
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    }),
  };
}
export async function passwordChangedMail(email: string) {
  const { from, transport } = mailTransport();
  try {
    await transport.sendMail({
      from,
      to: email,
      subject: 'Wandora — Mật khẩu đã được thay đổi',
      text: 'Mật khẩu Wandora của bạn vừa được thay đổi. Các phiên đăng nhập cũ đã hết hiệu lực. Nếu bạn không thực hiện thao tác này, hãy liên hệ quản trị viên ngay.',
    });
  } catch {
    console.error('Password change notification could not be delivered');
  } finally {
    transport.close();
  }
}
