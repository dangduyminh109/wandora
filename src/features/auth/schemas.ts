import { z } from 'zod';
export const loginSchema = z.object({ email: z.email().max(254).transform(value => value.trim().toLowerCase()), password: z.string().min(1).max(128) });
export const createUserSchema = z.object({
  email: z.email().max(254).transform(value => value.trim().toLowerCase()),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(128),
  role: z.enum(['admin', 'user']).default('user'),
});
