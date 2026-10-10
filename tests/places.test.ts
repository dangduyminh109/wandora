import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/lib/slug';
import {
  placeIdSchema,
  placeInputSchema,
  placeUpdateSchema,
  placesQuerySchema,
} from '../src/features/places/schemas';
import {
  catalogQuerySchema,
  hotelInputSchema,
  hotelUpdateSchema,
  serviceInputSchema,
} from '../src/features/catalog/schemas';
import {
  emptyPlaceForm,
  placeFormSchema,
  placeFormToInput,
} from '../src/features/places/form-schema';

const validPlace = {
  name: 'Bãi biển Mỹ Khê',
  category: 'beach',
  region: 'Đà Nẵng',
  location: { type: 'Point', coordinates: [108.2478, 16.0544] },
};
const placeId = 'a'.repeat(24);

test('slugify bỏ dấu tiếng Việt và ký tự đặc biệt', () => {
  assert.equal(slugify('Bãi biển Mỹ Khê'), 'bai-bien-my-khe');
  assert.equal(slugify('  Đà Lạt -- Thành phố ngàn hoa!  '), 'da-lat-thanh-pho-ngan-hoa');
  assert.equal(slugify('!!!'), '');
});

test('placeInputSchema áp dụng giá trị mặc định cho trường tùy chọn', () => {
  const place = placeInputSchema.parse(validPlace);
  assert.deepEqual([place.description, place.address, place.images, place.tags], ['', '', [], []]);
});

test('placeInputSchema từ chối tọa độ, ảnh và tên không hợp lệ', () => {
  for (const bad of [
    { ...validPlace, name: 'A' },
    { ...validPlace, location: { type: 'Point', coordinates: [200, 10] } },
    { ...validPlace, location: { type: 'Point', coordinates: [100, 95] } },
    { ...validPlace, images: ['not-a-url'] },
    { ...validPlace, category: '' },
  ]) {
    assert.equal(placeInputSchema.safeParse(bad).success, false);
  }
});

test('placeUpdateSchema không tự thêm giá trị mặc định (PATCH không ghi đè trường khác)', () => {
  assert.deepEqual(placeUpdateSchema.parse({ name: 'Tên mới' }), { name: 'Tên mới' });
  assert.equal(placeUpdateSchema.safeParse({}).success, false);
  // Trường lạ (ví dụ ratingAvg) bị loại bỏ, không thể cập nhật qua API.
  assert.deepEqual(placeUpdateSchema.parse({ name: 'Tên mới', ratingAvg: 5 }), {
    name: 'Tên mới',
  });
});

test('placeIdSchema chỉ nhận ObjectId 24 ký tự hex', () => {
  assert.equal(placeIdSchema.safeParse(placeId).success, true);
  for (const bad of ['', 'abc', 'g'.repeat(24), '{"$ne":null}']) {
    assert.equal(placeIdSchema.safeParse(bad).success, false);
  }
});

test('placesQuerySchema và catalogQuerySchema đặt mặc định và chặn trường sắp xếp lạ', () => {
  assert.equal(placesQuerySchema.parse({}).sortBy, 'createdAt');
  assert.equal(placesQuerySchema.parse({ page: '2' }).page, 2);
  assert.equal(catalogQuerySchema.parse({}).placeId, '');
  for (const bad of [{ sortBy: 'passwordHash' }, { pageSize: '51' }, { page: '-1' }]) {
    assert.equal(placesQuerySchema.safeParse(bad).success, false);
  }
  assert.equal(catalogQuerySchema.safeParse({ placeId: 'xyz' }).success, false);
});

test('schema khách sạn và dịch vụ', () => {
  const hotel = hotelInputSchema.parse({
    placeId,
    name: 'Khách sạn Biển',
    priceLevel: 3,
    stars: 4,
  });
  assert.deepEqual([hotel.amenities, hotel.phone, hotel.website], [[], '', '']);
  assert.equal(
    hotelInputSchema.safeParse({ placeId, name: 'KS', priceLevel: 5, stars: 4 }).success,
    false,
  );
  assert.equal(
    hotelInputSchema.safeParse({ placeId, name: 'Khách sạn', priceLevel: 2, stars: 6 }).success,
    false,
  );
  assert.deepEqual(hotelUpdateSchema.parse({ stars: 5 }), { stars: 5 });
  assert.equal(
    serviceInputSchema.safeParse({ placeId, name: 'Tour đảo', priceLevel: 2, type: 'khac' })
      .success,
    false,
  );
});

test('biểu mẫu địa điểm đổi chuỗi nhập thành dữ liệu API', () => {
  const data = placeFormSchema.parse({
    ...emptyPlaceForm,
    name: ' Bãi biển Mỹ Khê ',
    category: 'beach',
    region: 'Đà Nẵng',
    latitude: '16,0544',
    longitude: '108.2478',
    tags: 'biển, check-in, ,gia đình',
    images: 'https://a.com/1.jpg\r\n\r\nhttps://a.com/2.jpg\n',
  });
  const payload = placeFormToInput(data);
  assert.equal(payload.name, 'Bãi biển Mỹ Khê');
  assert.deepEqual(payload.location.coordinates, [108.2478, 16.0544]);
  assert.deepEqual(payload.tags, ['biển', 'check-in', 'gia đình']);
  assert.deepEqual(payload.images, ['https://a.com/1.jpg', 'https://a.com/2.jpg']);
  // Dữ liệu từ biểu mẫu phải qua được schema của API.
  assert.equal(placeInputSchema.safeParse(payload).success, true);
});

test('biểu mẫu địa điểm báo lỗi tọa độ sai', () => {
  const base = { ...emptyPlaceForm, name: 'Địa điểm', category: 'beach', region: 'Huế' };
  for (const coords of [
    { latitude: '', longitude: '10' },
    { latitude: 'abc', longitude: '10' },
    { latitude: '91', longitude: '10' },
    { latitude: '10', longitude: '181' },
  ]) {
    assert.equal(placeFormSchema.safeParse({ ...base, ...coords }).success, false);
  }
});
