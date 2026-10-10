import { slugify } from '../../src/lib/slug';
import { seedPlaces, type SeedPlace } from './places';

// Bộ sinh số ngẫu nhiên có hạt giống: cùng đầu vào luôn ra cùng dữ liệu (chạy lại seed không tạo bản sao).
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = () => number;
const pick = <T>(random: Random, items: readonly T[]) =>
  items[Math.floor(random() * items.length)]!;
const between = (random: Random, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));
function sample<T>(random: Random, items: readonly T[], count: number) {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length)
    out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]!);
  return out;
}

const hotelKinds = ['Khách sạn', 'Resort', 'Homestay', 'Villa', 'Nhà nghỉ'] as const;
const brandNames = [
  'Bình Minh',
  'Sao Mai',
  'Hoàng Gia',
  'An Nhiên',
  'Thiên Phúc',
  'Ánh Dương',
  'Lá Xanh',
  'Phương Nam',
  'Hải Âu',
  'Mây Trắng',
  'Tre Việt',
  'Thanh Bình',
];
const amenityPool = [
  'wifi',
  'hồ bơi',
  'bữa sáng',
  'đưa đón sân bay',
  'phòng gym',
  'spa',
  'bãi đỗ xe',
  'nhà hàng',
  'điều hòa',
  'view đẹp',
  'cho thuê xe máy',
];
const restaurantKinds = ['Nhà hàng', 'Quán', 'Bếp', 'Quán ăn'] as const;
const cuisinePool = [
  'Món Việt',
  'Hải sản',
  'Đặc sản vùng',
  'Nướng',
  'Lẩu',
  'Món chay',
  'Cà phê',
  'Ăn vặt',
];
const hours = ['06:00 - 21:00', '07:00 - 22:00', '10:00 - 22:00', '10:30 - 23:00', '17:00 - 24:00'];
const serviceDefs = [
  {
    type: 'tour',
    title: 'Tour khám phá',
    description: 'Tour trọn gói có hướng dẫn viên, phù hợp nhóm nhỏ và gia đình.',
  },
  {
    type: 'transport',
    title: 'Thuê xe đưa đón',
    description: 'Xe riêng đưa đón theo lịch trình, có thể thuê theo giờ hoặc theo ngày.',
  },
  {
    type: 'ticket',
    title: 'Vé tham quan',
    description: 'Đặt vé tham quan trước, tránh xếp hàng tại cổng.',
  },
  {
    type: 'other',
    title: 'Thuê xe máy',
    description: 'Cho thuê xe máy tự lái, có bảo hiểm và mũ bảo hiểm.',
  },
] as const;

const phoneOf = (random: Random) => `09${between(random, 10000000, 99999999)}`;

export function buildPlaceDoc(place: SeedPlace) {
  return {
    name: place.name,
    description: place.description,
    category: place.category,
    region: place.region,
    address: place.address,
    location: { type: 'Point' as const, coordinates: [place.lng, place.lat] as [number, number] },
    images: [] as string[],
    tags: place.tags,
  };
}

// Dữ liệu con sinh theo từng địa điểm (chưa có placeId; script seed gắn placeId sau khi có _id).
export function buildChildren(place: SeedPlace) {
  const random = rng(slugify(place.name));
  const hotelBrands = sample(random, brandNames, between(random, 3, 5));
  const hotels = hotelBrands.map((brand) => {
    const stars = between(random, 1, 5);
    const kind =
      stars >= 4 ? pick(random, ['Resort', 'Khách sạn', 'Villa']) : pick(random, hotelKinds);
    return {
      name: `${kind} ${brand} ${place.name}`,
      priceLevel: stars <= 2 ? 1 : stars === 3 ? 2 : stars === 4 ? 3 : 4,
      address: `Gần ${place.name}, ${place.region}`,
      phone: phoneOf(random),
      website: '',
      stars,
      amenities: sample(random, amenityPool, between(random, 3, 6)),
    };
  });
  const restaurantBrands = sample(random, brandNames, between(random, 2, 4));
  const restaurants = restaurantBrands.map((brand) => ({
    name: `${pick(random, restaurantKinds)} ${brand} ${place.name}`,
    priceLevel: between(random, 1, 3),
    address: `Gần ${place.name}, ${place.region}`,
    phone: phoneOf(random),
    website: '',
    cuisine: sample(random, cuisinePool, between(random, 1, 3)),
    openingHours: pick(random, hours),
  }));
  const services = sample(random, serviceDefs, between(random, 1, 3)).map((def) => ({
    name: `${def.title} ${place.name}`,
    priceLevel: between(random, 1, 3),
    address: place.region,
    phone: phoneOf(random),
    website: '',
    type: def.type,
    description: def.description,
  }));
  return { hotels, restaurants, services };
}

export function buildSeed() {
  return seedPlaces.map((place) => ({
    source: place,
    place: buildPlaceDoc(place),
    slug: slugify(place.name),
    ratingAvg: Math.round((3.4 + rng(`r-${place.name}`)() * 1.5) * 10) / 10,
    ratingCount: between(rng(`c-${place.name}`), 5, 400),
    ...buildChildren(place),
  }));
}
