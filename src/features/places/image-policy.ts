import { z } from 'zod';

export const MAX_PLACE_IMAGES = 20;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const uploadFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;

export function isImageSource(value: string) {
  if (value.startsWith('/api/uploads/'))
    return uploadFilenamePattern.test(value.slice('/api/uploads/'.length));
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const imageSourceSchema = z.string().trim().max(2048).refine(isImageSource, {
  message: 'Nhập URL ảnh bắt đầu bằng http:// hoặc https://, hoặc dùng ảnh đã tải lên.',
});

export const imageListSchema = z
  .array(imageSourceSchema)
  .max(MAX_PLACE_IMAGES, `Tối đa ${MAX_PLACE_IMAGES} ảnh cho mỗi địa điểm.`);
export const splitImageSources = (value: string) =>
  value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
