import type { z } from 'zod';
import { splitImageSources } from '@/features/places/image-policy';
import {
  hotelInputSchema,
  restaurantInputSchema,
  serviceInputSchema,
  serviceTypes,
} from './schemas';

export type CatalogKind = 'hotels' | 'restaurants' | 'services';

export type FieldDef = {
  name: string;
  label: string;
  kind: 'text' | 'multiline' | 'select' | 'list' | 'images';
  options?: { value: string; label: string }[];
  numeric?: boolean; // select có giá trị là số
  required?: boolean;
  helper?: string;
  maxLength?: number;
};

export type CatalogConfig = {
  kind: CatalogKind;
  endpoint: string;
  title: string;
  singular: string;
  description: string;
  searchPlaceholder: string;
  schema: z.ZodType;
  fields: FieldDef[];
};

const priceOptions = [
  { value: '1', label: '₫ – Bình dân' },
  { value: '2', label: '₫₫ – Trung bình' },
  { value: '3', label: '₫₫₫ – Cao cấp' },
  { value: '4', label: '₫₫₫₫ – Sang trọng' },
];
export const serviceTypeLabels: Record<string, string> = {
  tour: 'Tour',
  transport: 'Di chuyển',
  ticket: 'Vé',
  other: 'Khác',
};

const contactFields: FieldDef[] = [
  { name: 'images', label: 'Ảnh', kind: 'images' },
  { name: 'address', label: 'Địa chỉ', kind: 'text', maxLength: 200 },
  { name: 'phone', label: 'Số điện thoại', kind: 'text', maxLength: 30 },
  { name: 'website', label: 'Website', kind: 'text', helper: 'Bắt đầu bằng http:// hoặc https://' },
];
const nameField: FieldDef = {
  name: 'name',
  label: 'Tên',
  kind: 'text',
  required: true,
  maxLength: 120,
};
const priceField: FieldDef = {
  name: 'priceLevel',
  label: 'Mức giá',
  kind: 'select',
  numeric: true,
  required: true,
  options: priceOptions,
};

export const catalogConfigs: Record<CatalogKind, CatalogConfig> = {
  hotels: {
    kind: 'hotels',
    endpoint: '/api/hotels',
    title: 'Khách sạn',
    singular: 'khách sạn',
    description: 'Quản lý khách sạn, resort, homestay gắn với từng địa điểm.',
    searchPlaceholder: 'Tìm theo tên khách sạn',
    schema: hotelInputSchema,
    fields: [
      nameField,
      {
        name: 'stars',
        label: 'Số sao',
        kind: 'select',
        numeric: true,
        required: true,
        options: [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} sao` })),
      },
      priceField,
      {
        name: 'amenities',
        label: 'Tiện nghi',
        kind: 'list',
        helper: 'Cách nhau bằng dấu phẩy, ví dụ: wifi, hồ bơi, bữa sáng',
      },
      ...contactFields,
    ],
  },
  restaurants: {
    kind: 'restaurants',
    endpoint: '/api/restaurants',
    title: 'Nhà hàng',
    singular: 'nhà hàng',
    description: 'Quản lý nhà hàng, quán ăn gắn với từng địa điểm.',
    searchPlaceholder: 'Tìm theo tên nhà hàng',
    schema: restaurantInputSchema,
    fields: [
      nameField,
      priceField,
      {
        name: 'cuisine',
        label: 'Loại món',
        kind: 'list',
        helper: 'Cách nhau bằng dấu phẩy, ví dụ: hải sản, món Việt',
      },
      {
        name: 'openingHours',
        label: 'Giờ mở cửa',
        kind: 'text',
        helper: 'Ví dụ: 07:00 - 22:00',
        maxLength: 100,
      },
      ...contactFields,
    ],
  },
  services: {
    kind: 'services',
    endpoint: '/api/services',
    title: 'Dịch vụ',
    singular: 'dịch vụ',
    description: 'Quản lý tour, di chuyển, vé tham quan và dịch vụ khác.',
    searchPlaceholder: 'Tìm theo tên dịch vụ',
    schema: serviceInputSchema,
    fields: [
      nameField,
      {
        name: 'type',
        label: 'Loại dịch vụ',
        kind: 'select',
        required: true,
        options: serviceTypes.map((value) => ({ value, label: serviceTypeLabels[value]! })),
      },
      priceField,
      { name: 'description', label: 'Mô tả', kind: 'multiline', maxLength: 2000 },
      ...contactFields,
    ],
  },
};

export type FormValues = Record<string, string>;

export function emptyForm(config: CatalogConfig): FormValues {
  return Object.fromEntries(
    config.fields.map((field) => [
      field.name,
      field.kind === 'select' && field.name === 'priceLevel' ? '2' : '',
    ]),
  );
}

// Dữ liệu từ API -> giá trị hiển thị trong biểu mẫu (mọi trường đều là chuỗi).
export function itemToForm(config: CatalogConfig, item: Record<string, unknown>): FormValues {
  return Object.fromEntries(
    config.fields.map((field) => {
      const value = item[field.name];
      return [
        field.name,
        Array.isArray(value)
          ? value.join(field.kind === 'images' ? '\n' : ', ')
          : String(value ?? ''),
      ];
    }),
  );
}

// Giá trị biểu mẫu -> dữ liệu gửi API (tách danh sách theo dấu phẩy, ép số).
export function formToInput(config: CatalogConfig, placeId: string, values: FormValues) {
  const input: Record<string, unknown> = { placeId };
  for (const field of config.fields) {
    const raw = (values[field.name] ?? '').trim();
    if (field.kind === 'images') {
      input[field.name] = splitImageSources(raw);
    } else if (field.kind === 'list') {
      input[field.name] = raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    } else if (field.numeric) {
      input[field.name] = raw === '' ? undefined : Number(raw);
    } else {
      input[field.name] = raw;
    }
  }
  return input;
}

function messageFor(issue: z.core.$ZodIssue) {
  switch (issue.code) {
    case 'too_small':
      return 'Chưa nhập hoặc quá ngắn.';
    case 'too_big':
      return 'Quá dài.';
    case 'invalid_format':
      return 'Định dạng không hợp lệ (đường dẫn phải bắt đầu bằng http:// hoặc https://).';
    default:
      return 'Giá trị không hợp lệ.';
  }
}

export type ValidationResult =
  { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> };

export function validateForm(
  config: CatalogConfig,
  placeId: string | null,
  values: FormValues,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (!placeId) errors.placeId = 'Hãy chọn địa điểm.';
  const result = config.schema.safeParse(formToInput(config, placeId ?? '', values));
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'root');
      if (key === 'placeId' && errors.placeId) continue;
      errors[key] ??= messageFor(issue);
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: (result as { data: Record<string, unknown> }).data };
}
