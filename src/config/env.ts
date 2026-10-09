import { z } from 'zod';
const schema = z.object({
  APP_URL: z.url(),
  JWT_SECRET: z
    .string()
    .min(32)
    .refine((value) => !value.startsWith('replace-'), 'Replace the example JWT secret'),
  NEO4J_URI: z.string().min(1),
  NEO4J_USERNAME: z.string().min(1),
  NEO4J_PASSWORD: z.string().min(1),
  REDIS_URL: z.url(),
});
export function getEnv() {
  return schema.parse(process.env);
}
