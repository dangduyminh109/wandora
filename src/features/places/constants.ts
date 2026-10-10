export const placeCategories = [
  { value: 'beach', label: 'Biển' },
  { value: 'mountain', label: 'Núi' },
  { value: 'nature', label: 'Thiên nhiên' },
  { value: 'culture', label: 'Văn hóa – lịch sử' },
  { value: 'city', label: 'Thành phố' },
  { value: 'entertainment', label: 'Vui chơi giải trí' },
  { value: 'food', label: 'Ẩm thực' },
] as const;

export function categoryLabel(value: string) {
  return placeCategories.find((item) => item.value === value)?.label ?? value;
}
