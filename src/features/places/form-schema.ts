import { z } from 'zod';
import type { Place } from './types';
import { imageListSchema, splitImageSources } from './image-policy';

const inRange = (value: string, min: number, max: number) => {
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number >= min && number <= max;
};

// Schema của biểu mẫu: người dùng nhập chuỗi, hàm placeFormToInput đổi sang dữ liệu gửi API.
export const placeFormSchema = z.object({
  name: z.string().trim().min(2, 'Tên cần ít nhất 2 ký tự.').max(120, 'Tên tối đa 120 ký tự.'),
  description: z.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự.'),
  category: z.string().trim().min(1, 'Chọn danh mục.'),
  region: z.string().trim().min(1, 'Nhập khu vực.').max(80, 'Khu vực tối đa 80 ký tự.'),
  address: z.string().trim().max(200, 'Địa chỉ tối đa 200 ký tự.'),
  latitude: z
    .string()
    .trim()
    .min(1, 'Nhập vĩ độ.')
    .refine((value) => inRange(value, -90, 90), 'Vĩ độ phải là số từ -90 đến 90.'),
  longitude: z
    .string()
    .trim()
    .min(1, 'Nhập kinh độ.')
    .refine((value) => inRange(value, -180, 180), 'Kinh độ phải là số từ -180 đến 180.'),
  tags: z.string().trim(),
  images: z
    .string()
    .trim()
    .refine(
      (value) => imageListSchema.safeParse(splitImageSources(value)).success,
      'Dùng tối đa 20 ảnh hợp lệ (JPG, PNG, WebP tải lên hoặc URL http/https).',
    ),
});

export type PlaceFormValues = z.infer<typeof placeFormSchema>;

export const emptyPlaceForm: PlaceFormValues = {
  name: '',
  description: '',
  category: '',
  region: '',
  address: '',
  latitude: '',
  longitude: '',
  tags: '',
  images: '',
};

export function placeToForm(place: Place): PlaceFormValues {
  return {
    name: place.name,
    description: place.description,
    category: place.category,
    region: place.region,
    address: place.address,
    longitude: String(place.location.coordinates[0]),
    latitude: String(place.location.coordinates[1]),
    tags: place.tags.join(', '),
    images: place.images.join('\n'),
  };
}

const toNumber = (value: string) => Number(value.replace(',', '.'));

export function placeFormToInput(data: PlaceFormValues) {
  return {
    name: data.name,
    description: data.description,
    category: data.category,
    region: data.region,
    address: data.address,
    location: {
      type: 'Point' as const,
      coordinates: [toNumber(data.longitude), toNumber(data.latitude)] as [number, number],
    },
    tags: data.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    images: data.images
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  };
}
