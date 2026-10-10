import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSeed } from '../scripts/seed-data/generate';
import { placeInputSchema, placesQuerySchema } from '../src/features/places/schemas';
import {
  hotelInputSchema,
  restaurantInputSchema,
  serviceInputSchema,
} from '../src/features/catalog/schemas';
import { placeCategories } from '../src/features/places/constants';

const placeId = '0123456789abcdef01234567';
const seed = buildSeed();

test('dữ liệu mẫu địa điểm hợp lệ, slug không trùng, tọa độ nằm trong Việt Nam', () => {
  assert.ok(seed.length >= 60);
  const categories = new Set(placeCategories.map((c) => c.value));
  for (const item of seed) {
    assert.ok(placeInputSchema.safeParse(item.place).success, item.place.name);
    assert.ok(categories.has(item.place.category as never), item.place.name);
    const [lng, lat] = item.place.location.coordinates;
    assert.ok(lng > 102 && lng < 110 && lat > 8 && lat < 24, item.place.name);
  }
  assert.equal(new Set(seed.map((s) => s.slug)).size, seed.length);
});

test('khách sạn, nhà hàng, dịch vụ mẫu hợp lệ và slug không trùng', () => {
  const names = {
    hotels: new Set<string>(),
    restaurants: new Set<string>(),
    services: new Set<string>(),
  };
  for (const item of seed) {
    for (const hotel of item.hotels) {
      assert.ok(hotelInputSchema.safeParse({ ...hotel, placeId }).success, hotel.name);
      names.hotels.add(hotel.name);
    }
    for (const row of item.restaurants) {
      assert.ok(restaurantInputSchema.safeParse({ ...row, placeId }).success, row.name);
      names.restaurants.add(row.name);
    }
    for (const row of item.services) {
      assert.ok(serviceInputSchema.safeParse({ ...row, placeId }).success, row.name);
      names.services.add(row.name);
    }
  }
  const total = (key: 'hotels' | 'restaurants' | 'services') =>
    seed.reduce((sum, item) => sum + item[key].length, 0);
  assert.equal(names.hotels.size, total('hotels'));
  assert.equal(names.restaurants.size, total('restaurants'));
  assert.equal(names.services.size, total('services'));
  assert.ok(total('hotels') >= 200);
});

test('sinh dữ liệu mẫu là xác định (chạy lại ra cùng kết quả)', () => {
  assert.deepEqual(buildSeed(), buildSeed());
});

test('query tìm kiếm: minRating và sortBy relevance', () => {
  const q = placesQuerySchema.parse({ minRating: '4', sortBy: 'relevance', search: 'biển' });
  assert.equal(q.minRating, 4);
  assert.equal(q.sortBy, 'relevance');
  assert.equal(placesQuerySchema.parse({}).minRating, 0);
  assert.equal(placesQuerySchema.safeParse({ minRating: '6' }).success, false);
});
