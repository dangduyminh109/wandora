import { z } from 'zod';

export const reviewInputSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Đánh giá tối thiểu 1 sao.')
    .max(5, 'Đánh giá tối đa 5 sao.'),
  comment: z.string().trim().max(1000, 'Bình luận tối đa 1000 ký tự.').default(''),
});

export const reviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
