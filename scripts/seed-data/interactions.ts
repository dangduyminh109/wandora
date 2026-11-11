import { createHash } from 'node:crypto';
import type { Activity } from '../../src/features/activity/schemas';

export const demoGroups = [
  {
    label: 'Nghỉ dưỡng biển',
    categories: ['beach'],
    searches: ['Bãi biển nghỉ dưỡng', 'Khách sạn gần biển', 'Hồ bơi ngoài trời'],
  },
  {
    label: 'Thiên nhiên và leo núi',
    categories: ['nature', 'mountain'],
    searches: ['Tour khám phá thiên nhiên', 'Đưa đón đi trekking', 'Tour ngắm cảnh núi rừng'],
  },
  {
    label: 'Văn hóa và di sản',
    categories: ['culture'],
    searches: ['Vé tham quan di tích', 'Tour tìm hiểu lịch sử', 'Vé tham quan kiến trúc cổ'],
  },
  {
    label: 'Ẩm thực và thành phố',
    categories: ['food', 'city'],
    searches: ['Nhà hàng món địa phương', 'Quán cà phê đẹp', 'Nhà hàng gần phố đi bộ'],
  },
  {
    label: 'Du lịch gia đình',
    categories: ['entertainment', 'city', 'beach'],
    searches: ['Khu vui chơi cho gia đình', 'Khách sạn có hồ bơi', 'Tour du lịch cùng trẻ nhỏ'],
  },
];

const names = [
  ['Nguyễn Minh Anh', 'nguyen.minh.anh'],
  ['Trần Hoàng Nam', 'tran.hoang.nam'],
  ['Lê Thu Hà', 'le.thu.ha'],
  ['Phạm Quỳnh Mai', 'pham.quynh.mai'],
  ['Võ Đức Huy', 'vo.duc.huy'],
  ['Đặng Ngọc Linh', 'dang.ngoc.linh'],
  ['Bùi Anh Tuấn', 'bui.anh.tuan'],
  ['Đỗ Khánh Vy', 'do.khanh.vy'],
  ['Ngô Hải Đăng', 'ngo.hai.dang'],
  ['Dương Thảo Nguyên', 'duong.thao.nguyen'],
  ['Hồ Gia Bảo', 'ho.gia.bao'],
  ['Vũ Thanh Trúc', 'vu.thanh.truc'],
  ['Nguyễn Phương Thảo', 'nguyen.phuong.thao'],
  ['Trần Quốc Bảo', 'tran.quoc.bao'],
  ['Lê Hoài An', 'le.hoai.an'],
  ['Phạm Minh Khang', 'pham.minh.khang'],
  ['Võ Ngọc Hân', 'vo.ngoc.han'],
  ['Đặng Tuấn Kiệt', 'dang.tuan.kiet'],
  ['Bùi Hà My', 'bui.ha.my'],
  ['Đỗ Nhật Minh', 'do.nhat.minh'],
  ['Ngô Bảo Châu', 'ngo.bao.chau'],
  ['Dương Đức Phúc', 'duong.duc.phuc'],
  ['Hồ Thanh Tâm', 'ho.thanh.tam'],
  ['Vũ Khánh Linh', 'vu.khanh.linh'],
  ['Nguyễn Gia Hân', 'nguyen.gia.han'],
  ['Trần Anh Dũng', 'tran.anh.dung'],
  ['Lê Ngọc Ánh', 'le.ngoc.anh'],
  ['Phạm Đức Anh', 'pham.duc.anh'],
  ['Võ Thùy Dương', 'vo.thuy.duong'],
  ['Đặng Hoàng Long', 'dang.hoang.long'],
];
export const demoUsers = names.map(([name, email], index) => ({
  name,
  email: `${email}@wandora.local`,
  group: Math.floor(index / 6),
}));
export type DemoPlace = { id: string; name: string; category: string; region: string };
type DemoUser = { id: string; name: string; email: string; group: number };
const hash = (value: string) => createHash('sha256').update(value).digest().readUInt32BE(0);
const observations: Record<string, string[]> = {
  beach: [
    'Bãi biển thoáng, đi dạo vào buổi sáng rất dễ chịu',
    'Cảnh biển đẹp và có nhiều góc chụp ảnh',
    'Không gian phù hợp nghỉ ngơi cuối tuần',
  ],
  nature: [
    'Không khí trong lành, khung cảnh có nhiều cây xanh',
    'Cảnh quan tự nhiên rất đáng trải nghiệm',
    'Đi chậm và ngắm cảnh sẽ cảm nhận được vẻ đẹp nơi này',
  ],
  mountain: [
    'Đường lên có nhiều đoạn đẹp để dừng ngắm cảnh',
    'Phong cảnh núi rừng ấn tượng',
    'Nên mang giày dễ đi và chuẩn bị nước uống',
  ],
  culture: [
    'Kiến trúc và câu chuyện lịch sử rất thú vị',
    'Không gian cổ kính, phù hợp tìm hiểu văn hóa địa phương',
    'Nên dành thời gian đọc bảng giới thiệu hoặc nghe hướng dẫn',
  ],
  city: [
    'Đi bộ buổi chiều khá thoải mái, xung quanh có nhiều hàng quán',
    'Không gian nhộn nhịp và dễ kết hợp với các điểm gần đó',
    'Phù hợp dạo phố và tìm hiểu nhịp sống địa phương',
  ],
  food: [
    'Có nhiều lựa chọn ăn uống để khám phá',
    'Mình thích trải nghiệm món ăn và không khí địa phương',
    'Đi cùng bạn bè sẽ dễ thử được nhiều món hơn',
  ],
  entertainment: [
    'Phù hợp đi cùng gia đình và bạn bè',
    'Có nhiều hoạt động để dành trọn một buổi trải nghiệm',
    'Nên lên lịch trước để tận dụng thời gian tham quan',
  ],
};

export function buildDemoInteractions(places: DemoPlace[], users: DemoUser[], now: Date) {
  if (users.length !== 30) throw new Error('Cần đúng 30 người dùng cho bộ dữ liệu này.');
  const reviews: {
    placeId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[] = [];
  const favorites: { userId: string; placeId: string; createdAt: string }[] = [];
  const events: Activity[] = [];
  users.forEach((user, index) => {
    const group = demoGroups[user.group];
    const pool = places
      .filter((place) => group.categories.includes(place.category))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (pool.length < 5) throw new Error(`Chưa đủ địa điểm cho nhóm ${group.label}.`);
    const rotated = [...pool].sort((a, b) => hash(user.email + a.id) - hash(user.email + b.id));
    const selected = [pool[0], ...rotated.filter((place) => place.id !== pool[0].id).slice(0, 4)];
    const reviewCount = index < 10 ? 4 : 3;
    for (let j = 0; j < reviewCount; j++) {
      const place = selected[j];
      const rating =
        (index + j) % 13 === 0 ? 2 : (index + j) % 7 === 0 ? 3 : (index + j) % 3 === 0 ? 4 : 5;
      const observation = (observations[place.category] ?? observations.nature)[(index + j) % 3];
      const ending =
        rating <= 2
          ? 'Lần này trải nghiệm chưa như kỳ vọng vì khá đông, mình sẽ cân nhắc giờ ghé lại.'
          : rating === 3
            ? 'Trải nghiệm ổn, nhưng nên tránh giờ cao điểm.'
            : rating === 4
              ? 'Nhìn chung đáng ghé nếu có dịp quay lại khu vực này.'
              : 'Đây là một điểm mình muốn giới thiệu cho bạn bè.';
      reviews.push({
        placeId: place.id,
        userId: user.id,
        userName: user.name,
        rating,
        comment: `${['Mình vừa ghé', 'Trong chuyến đi gần đây mình đã đến', 'Mình có dịp trải nghiệm', 'Cuối tuần vừa rồi mình ghé'][index % 4]} ${place.name}. ${observation}. ${ending}`,
        createdAt: new Date(
          now.getTime() - (2 + ((index * 3 + j) % 18)) * 86_400_000 - j * 60_000,
        ).toISOString(),
      });
    }
    selected.slice(0, 3).forEach((place, j) => {
      if (
        reviews.some(
          (review) => review.userId === user.id && review.placeId === place.id && review.rating < 4,
        )
      )
        return;
      favorites.push({
        userId: user.id,
        placeId: place.id,
        createdAt: new Date(now.getTime() - ((index % 10) + j + 1) * 86_400_000).toISOString(),
      });
    });
    const count = index < 10 ? 34 : 33;
    for (let j = 0; j < count; j++) {
      const eventIndex = events.length;
      const search = eventIndex % 5 === 4;
      const place = selected[(j + index) % selected.length];
      const occurredAt = new Date(
        now.getTime() -
          (j === 0 ? 0 : (j * 7 + index * 3) % 21) * 86_400_000 -
          (index * 17 + j * 11 + 1) * 60_000,
      ).toISOString();
      events.push({
        id: `seed-${eventIndex}`,
        userId: user.id,
        type: search ? 'search' : 'place_view',
        placeId: search ? '' : place.id,
        label: search
          ? `${group.searches[(j + index) % group.searches.length]} ${place.region}`
          : place.name,
        category: search ? '' : place.category,
        region: search ? '' : place.region,
        occurredAt,
      });
    }
  });
  return { reviews, favorites, events };
}
