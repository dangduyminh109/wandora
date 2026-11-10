import { slugify } from '@/lib/slug';

// Tìm kiếm địa điểm = full-text của MongoDB (khớp theo từ nguyên vẹn, không phân biệt dấu) HỢP với
// khớp theo ĐẦU TỪ trong tên. Chỉ riêng $text thì gõ dở "Mu" không ra "Mũi Né", và tên địa điểm không
// được ưu tiên hơn việc từ khóa chỉ nằm trong mô tả. Không import 'server-only' để test được.

// Điểm cộng cho địa điểm có tên khớp đầu từ; lớn hơn mọi điểm textScore thực tế nên tên luôn đứng trước.
export const NAME_MATCH_BONUS = 100;

// Mẫu regex trên slug (đã bỏ dấu, nối bằng "-"): "ha lo" → "(^|-)ha-lo" khớp "vinh-ha-long".
// Slug chỉ gồm [a-z0-9-] nên chèn thẳng vào regex là an toàn.
export function namePrefixPattern(search: string): string | null {
  const fragment = slugify(search);
  return fragment ? `(^|-)${fragment}` : null;
}

// Trả danh sách id theo độ liên quan giảm dần: điểm textScore, cộng NAME_MATCH_BONUS nếu tên khớp.
export function rankMatches(
  textScores: ReadonlyMap<string, number>,
  nameMatchIds: Iterable<string>,
): string[] {
  const scores = new Map(textScores);
  for (const id of nameMatchIds) scores.set(id, (scores.get(id) ?? 0) + NAME_MATCH_BONUS);
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}
