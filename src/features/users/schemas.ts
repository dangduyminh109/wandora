import { z } from 'zod';
export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email({ error: 'Nhập email hợp lệ.' })),
  name: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự.').max(100),
  password: z.string().min(12, 'Mật khẩu cần ít nhất 12 ký tự.').max(128),
  role: z.enum(['admin', 'user']).default('user'),
});
export const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(0).max(100000).default(0),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(''),
  sortBy: z.enum(['name', 'email', 'role', 'createdAt']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
