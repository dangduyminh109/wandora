import { z } from 'zod';
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email({ error: 'Nhập email hợp lệ.' })),
  password: z.string().min(1, 'Nhập mật khẩu.').max(128),
});
