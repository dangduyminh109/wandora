import { z } from 'zod';
import { objectIdSchema } from '@/lib/mongo-id';
import { isAmenityCode } from '@/features/places/amenities';

export const activityInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('place_view'), placeId: objectIdSchema }),
  z.object({
    type: z.literal('search'),
    search: z.string().trim().min(1).max(100),
    // Có khi người dùng tìm theo tiện ích: dùng làm tín hiệu sở thích cho phần gợi ý.
    amenities: z
      .array(z.string().refine(isAmenityCode, 'Tiện ích không hợp lệ.'))
      .max(10)
      .optional(),
  }),
]);
export const daySchema = z.iso.date();
export const historyQuerySchema = z.object({
  day: daySchema.default(() => new Date().toISOString().slice(0, 10)),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.uuid({ version: 'v1' }).optional(),
});
export const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
});
export type Activity = {
  id: string;
  userId: string;
  occurredAt: string;
  type: 'search' | 'place_view';
  placeId: string;
  label: string;
  category: string;
  region: string;
};
