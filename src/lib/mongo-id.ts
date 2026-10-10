import { z } from 'zod';

export const objectIdPattern = /^[a-f\d]{24}$/i;
export const objectIdSchema = z.string().regex(objectIdPattern, 'Mã không hợp lệ.');
