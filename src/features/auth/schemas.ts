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

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự.').max(100),
    email: loginSchema.shape.email,
    password: z.string().min(12, 'Mật khẩu cần ít nhất 12 ký tự.').max(128),
    confirmPassword: z.string().max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  });
