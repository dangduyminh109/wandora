import { z } from 'zod';
import { objectIdSchema } from '@/lib/mongo-id';
import { imageListSchema } from '@/features/places/image-policy';

const nonEmpty = (value: object) => Object.keys(value).length > 0;
const EMPTY_UPDATE = 'Cần ít nhất một trường để cập nhật.';

const phone = z.string().trim().max(30);
const website = z.union([z.url(), z.literal('')]);
const address = z.string().trim().max(200);
const tagList = z.array(z.string().trim().min(1).max(40)).max(30);

const base = {
  placeId: objectIdSchema,
  name: z.string().trim().min(2).max(120),
  priceLevel: z.number().int().min(1).max(4),
  address,
  phone,
  website,
  images: imageListSchema,
};

// --- Khách sạn ---
const hotelFields = {
  ...base,
  stars: z.number().int().min(1).max(5),
  amenities: tagList,
};
export const hotelInputSchema = z.object({
  ...hotelFields,
  images: imageListSchema.default([]),
  address: address.default(''),
  phone: phone.default(''),
  website: website.default(''),
  amenities: tagList.default([]),
});
export const hotelUpdateSchema = z.object(hotelFields).partial().refine(nonEmpty, EMPTY_UPDATE);
export type HotelInput = z.output<typeof hotelInputSchema>;

// --- Nhà hàng ---
const restaurantFields = {
  ...base,
  cuisine: tagList,
  openingHours: z.string().trim().max(100),
};
export const restaurantInputSchema = z.object({
  ...restaurantFields,
  images: imageListSchema.default([]),
  address: address.default(''),
  phone: phone.default(''),
  website: website.default(''),
  cuisine: tagList.default([]),
  openingHours: restaurantFields.openingHours.default(''),
});
export const restaurantUpdateSchema = z
  .object(restaurantFields)
  .partial()
  .refine(nonEmpty, EMPTY_UPDATE);
export type RestaurantInput = z.output<typeof restaurantInputSchema>;

// --- Dịch vụ khác ---
export const serviceTypes = ['tour', 'transport', 'ticket', 'other'] as const;
const serviceFields = {
  ...base,
  type: z.enum(serviceTypes),
  description: z.string().trim().max(2000),
};
export const serviceInputSchema = z.object({
  ...serviceFields,
  images: imageListSchema.default([]),
  address: address.default(''),
  phone: phone.default(''),
  website: website.default(''),
  description: serviceFields.description.default(''),
});
export const serviceUpdateSchema = z.object(serviceFields).partial().refine(nonEmpty, EMPTY_UPDATE);
export type ServiceInput = z.output<typeof serviceInputSchema>;

// --- Truy vấn danh sách (dùng chung) ---
export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(0).max(100000).default(0),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(''),
  placeId: z.union([objectIdSchema, z.literal('')]).default(''),
  sortBy: z.enum(['createdAt', 'name', 'priceLevel']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
