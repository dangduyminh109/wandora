import { z } from 'zod';
import { loginSchema } from '@/features/auth/schemas';
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự.').max(100),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((value) => !value || /^[+\d\s().-]{6,30}$/.test(value), 'Nhập số điện thoại hợp lệ.'),
  bio: z.string().trim().max(500, 'Giới thiệu tối đa 500 ký tự.'),
});
export const newPassword = z.string().min(12, 'Mật khẩu cần ít nhất 12 ký tự.').max(128);
const confirmation = { message: 'Mật khẩu xác nhận không khớp.', path: ['confirmPassword'] };
export const changePasswordSchema = z
  .object({
    currentPassword: loginSchema.shape.password,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, confirmation)
  .refine((data) => data.password !== data.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
    path: ['password'],
  });
export const forgotPasswordSchema = z.object({ email: loginSchema.shape.email });
export const resetPasswordSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/, 'Link đặt lại mật khẩu không hợp lệ.'),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, confirmation);
export const editUserSchema = z.object({
  name: profileSchema.shape.name,
  email: loginSchema.shape.email,
  role: z.enum(['admin', 'user']),
  status: z.enum(['active', 'locked']),
});
export const updateUserSchema = editUserSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần ít nhất một thay đổi.');
