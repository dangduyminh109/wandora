import { z } from 'zod';
import { objectIdPattern } from '@/lib/mongo-id';

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
  images: z.array(z.url()).max(10),
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

export const placeSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/);

export type PlaceInput = z.output<typeof placeInputSchema>;
