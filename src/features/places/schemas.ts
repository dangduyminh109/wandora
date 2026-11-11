import { z } from 'zod';
import { objectIdPattern } from '@/lib/mongo-id';
import { isAmenityCode } from './amenities';
import { imageListSchema } from './image-policy';

const geoPoint = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});

const fields = {
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000),
  category: z.string().trim().min(1).max(50),
  region: z.string().trim().min(1).max(80),
  address: z.string().trim().max(200),
  location: geoPoint,
  images: imageListSchema,
  tags: z.array(z.string().trim().min(1).max(30)).max(20),
};

export const placeInputSchema = z.object({
  ...fields,
  description: fields.description.default(''),
  address: fields.address.default(''),
  images: fields.images.default([]),
  tags: fields.tags.default([]),
});

export const placeUpdateSchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Cần ít nhất một trường để cập nhật.');

export const placeIdSchema = z.string().regex(objectIdPattern, 'Mã địa điểm không hợp lệ.');

export const placesQuerySchema = z.object({
  page: z.coerce.number().int().min(0).max(100000).default(0),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(''),
  category: z.string().trim().max(50).default(''),
  region: z.string().trim().max(80).default(''),
  nameContains: z.string().trim().max(100).default(''),
  minRating: z.coerce.number().min(0).max(5).default(0),
  sortBy: z.enum(['createdAt', 'name', 'ratingAvg', 'relevance']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const MAX_SEARCH_AMENITIES = 10;

// `amenities` nhận chuỗi phân tách bằng dấu phẩy (?amenities=pool,hotel). Mã lạ bị từ chối thay vì
// bị bỏ qua âm thầm, để lỗi gõ sai không biến thành một lần tìm kiếm khác với ý người dùng.
export const amenitySearchQuerySchema = z.object({
  amenities: z
    .string()
    .trim()
    .transform((value) => [
      ...new Set(
        value
          .split(',')
          .map((code) => code.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(
      z
        .array(z.string())
        .min(1, 'Chọn ít nhất một tiện ích.')
        .max(MAX_SEARCH_AMENITIES, `Chọn tối đa ${MAX_SEARCH_AMENITIES} tiện ích.`)
        .refine((codes) => codes.every(isAmenityCode), 'Có tiện ích không hợp lệ.'),
    ),
  category: z.string().trim().max(50).default(''),
  region: z.string().trim().max(80).default(''),
  minRating: z.coerce.number().min(0).max(5).default(0),
  page: z.coerce.number().int().min(0).max(100000).default(0),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const placeSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

export type PlaceInput = z.output<typeof placeInputSchema>;
