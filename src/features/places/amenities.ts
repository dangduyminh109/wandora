import { slugify } from '@/lib/slug';

// Danh mục tiện ích chuẩn. `value` là mã lưu trong CSDL; `synonyms` dùng để chuẩn hoá chuỗi tự do
// (khách sạn.amenities, tags…) về cùng một mã. Đồng nghĩa được so khớp sau khi bỏ dấu, viết thường.
export const amenityCatalog = [
  { value: 'hotel', label: 'Khách sạn', synonyms: ['khach san', 'resort', 'homestay', 'villa'] },
  { value: 'restaurant', label: 'Nhà hàng', synonyms: ['nha hang', 'quan an', 'am thuc'] },
  { value: 'cafe', label: 'Quán cà phê', synonyms: ['ca phe', 'cafe', 'coffee'] },
  { value: 'pool', label: 'Hồ bơi', synonyms: ['ho boi', 'be boi', 'pool', 'swimming'] },
  { value: 'spa', label: 'Spa', synonyms: ['spa', 'massage'] },
  {
    value: 'amusement_park',
    label: 'Khu vui chơi',
    synonyms: ['khu vui choi', 'cong vien giai tri', 'vui choi', 'amusement'],
  },
  { value: 'beach', label: 'Bãi biển', synonyms: ['bai bien', 'bai tam', 'beach'] },
  { value: 'tour', label: 'Tour', synonyms: ['tour'] },
  { value: 'transport', label: 'Đưa đón / thuê xe', synonyms: ['thue xe', 'dua don', 'transport'] },
  { value: 'ticket', label: 'Vé tham quan', synonyms: ['ve tham quan', 've vao cong', 'ticket'] },
] as const;

export type AmenityCode = (typeof amenityCatalog)[number]['value'];

export const amenityCodes = amenityCatalog.map((item) => item.value) as AmenityCode[];

export function amenityLabel(code: string) {
  return amenityCatalog.find((item) => item.value === code)?.label ?? code;
}

export function isAmenityCode(value: string): value is AmenityCode {
  return (amenityCodes as string[]).includes(value);
}

// Chuỗi tự do ("Hồ bơi", "bể bơi", "pool"…) → mã chuẩn, hoặc undefined nếu không nhận ra.
// So khớp theo từ nguyên vẹn để "spa" không khớp nhầm vào "spaghetti".
export function normalizeAmenity(text: string): AmenityCode | undefined {
  const normalized = ` ${slugify(text).replaceAll('-', ' ')} `;
  if (!normalized.trim()) return undefined;
  return amenityCatalog.find(
    (item) =>
      item.value === slugify(text).replaceAll('-', '_') ||
      item.synonyms.some((synonym) => normalized.includes(` ${synonym} `)),
  )?.value;
}

// Ánh xạ cố định từ category của địa điểm và loại dịch vụ sang mã tiện ích.
const categoryAmenity: Record<string, AmenityCode> = {
  beach: 'beach',
  entertainment: 'amusement_park',
};
const serviceAmenity: Record<string, AmenityCode> = {
  tour: 'tour',
  transport: 'transport',
  ticket: 'ticket',
};

// Tiện ích "gần giống" nhau (vô hướng). `weight` ∈ (0,1) là mức thay thế được: 0.7 nghĩa là có B
// thì đáp ứng được 70% nhu cầu muốn A. Nguồn duy nhất cho cả điểm số lẫn đồ thị Neo4j (SIMILAR_TO).
// Trọng số phải là bội của 0.1 để thứ hạng theo điểm không bị đảo bởi phần cộng đánh giá.
export const amenitySimilarities: readonly { a: AmenityCode; b: AmenityCode; weight: number }[] = [
  { a: 'pool', b: 'beach', weight: 0.7 },
  { a: 'pool', b: 'spa', weight: 0.5 },
  { a: 'amusement_park', b: 'tour', weight: 0.5 },
  { a: 'amusement_park', b: 'beach', weight: 0.4 },
  { a: 'amusement_park', b: 'pool', weight: 0.4 },
  { a: 'restaurant', b: 'cafe', weight: 0.6 },
  { a: 'tour', b: 'ticket', weight: 0.5 },
  { a: 'tour', b: 'transport', weight: 0.4 },
];

export type SimilarMatch = { wanted: string; via: string; weight: number };

export type AmenityMatch = {
  matched: string[];
  // Tiện ích muốn có nhưng địa điểm chỉ có tiện ích gần giống (thay thế một phần).
  similar: SimilarMatch[];
  missing: string[];
  // 'full': có đủ mọi tiện ích đã chọn; 'partial': có ít nhất một tiện ích đúng nhưng chưa đủ;
  // 'similar': không có tiện ích nào đúng, chỉ có tiện ích gần giống.
  type: 'full' | 'partial' | 'similar';
  score: number;
};

// Điểm = (số tiện ích khớp đúng + tổng trọng số các tiện ích gần giống) / số tiện ích đã chọn, cộng
// thêm tối đa 0.009 theo đánh giá chỉ để phân hạng các địa điểm bằng điểm. Khoảng cách nhỏ nhất giữa
// hai mức điểm khác nhau là 0.1/10 = 0.01 (trọng số là bội của 0.1, tối đa 10 tiện ích) nên phần cộng
// đánh giá chỉ phân hạng các địa điểm cùng mức khớp, không đảo thứ hạng của những địa điểm khác mức khớp.
// Xếp hạng theo điểm chứ không theo nhãn: địa điểm gần giống nhiều tiện ích có thể xếp trên địa điểm
// chỉ khớp đúng một tiện ích. "Khớp đủ" luôn đứng đầu vì có điểm >= 1, các loại còn lại < 1.
export function matchAmenities(
  selected: readonly string[],
  placeAmenities: readonly string[],
  ratingAvg = 0,
  similarity: Readonly<Record<string, { via: string; weight: number }>> = {},
): AmenityMatch {
  const have = new Set(placeAmenities);
  const matched = selected.filter((code) => have.has(code));
  const similar = selected
    .filter((code) => !have.has(code) && similarity[code])
    .map((code) => ({ wanted: code, ...similarity[code]! }));
  const covered = new Set([...matched, ...similar.map((item) => item.wanted)]);
  const missing = selected.filter((code) => !covered.has(code));
  const total = matched.length + similar.reduce((sum, item) => sum + item.weight, 0);
  const rating = (Math.min(Math.max(ratingAvg, 0), 5) / 5) * 0.009;
  const type =
    selected.length > 0 && matched.length === selected.length
      ? 'full'
      : matched.length > 0
        ? 'partial'
        : 'similar';
  return {
    matched,
    similar,
    missing,
    type,
    score: selected.length ? Math.round((total / selected.length + rating) * 10000) / 10000 : 0,
  };
}

export type AmenitySource = {
  place: { category: string; tags: readonly string[] };
  hotels: readonly { amenities?: readonly string[] }[];
  restaurants: readonly { cuisine?: readonly string[] }[];
  services: readonly { type?: string }[];
};

// Tiện ích của một địa điểm = hợp của: category, tags, và dữ liệu con (khách sạn/nhà hàng/dịch vụ).
export function deriveAmenities({ place, hotels, restaurants, services }: AmenitySource) {
  const found = new Set<AmenityCode>();
  const add = (code: AmenityCode | undefined) => code && found.add(code);

  add(categoryAmenity[place.category]);
  for (const tag of place.tags) add(normalizeAmenity(tag));

  if (hotels.length) found.add('hotel');
  for (const hotel of hotels) for (const item of hotel.amenities ?? []) add(normalizeAmenity(item));

  if (restaurants.length) found.add('restaurant');
  for (const restaurant of restaurants)
    for (const item of restaurant.cuisine ?? []) add(normalizeAmenity(item));

  for (const service of services) add(serviceAmenity[service.type ?? '']);

  // Giữ thứ tự theo danh mục để kết quả ổn định giữa các lần tính.
  return amenityCodes.filter((code) => found.has(code));
}
