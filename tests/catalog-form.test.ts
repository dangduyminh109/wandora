import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  catalogConfigs,
  emptyForm,
  formToInput,
  itemToForm,
  validateForm,
} from '../src/features/catalog/form-config';
import { placesQuerySchema } from '../src/features/places/schemas';

const placeId = '0123456789abcdef01234567';

test('biểu mẫu khách sạn: chuyển chuỗi thành số và danh sách', () => {
  const input = formToInput(catalogConfigs.hotels, placeId, {
    ...emptyForm(catalogConfigs.hotels),
    name: '  Khách sạn Biển Xanh ',
    stars: '4',
    priceLevel: '3',
    amenities: 'wifi, hồ bơi,, ',
  });
  assert.equal(input.name, 'Khách sạn Biển Xanh');
  assert.equal(input.stars, 4);
  assert.equal(input.priceLevel, 3);
  assert.deepEqual(input.amenities, ['wifi', 'hồ bơi']);
});

test('validateForm: hợp lệ thì trả dữ liệu đã áp mặc định', () => {
  const result = validateForm(catalogConfigs.restaurants, placeId, {
    ...emptyForm(catalogConfigs.restaurants),
    name: 'Quán Hải Sản Biển',
    cuisine: 'hải sản',
  });
  assert.ok(result.ok);
  if (result.ok) {
    assert.equal(result.data.placeId, placeId);
    assert.deepEqual(result.data.cuisine, ['hải sản']);
    assert.equal(result.data.website, '');
  }
});

test('validateForm: báo lỗi theo từng trường (thiếu địa điểm, tên rỗng, website sai, chưa chọn số sao)', () => {
  const result = validateForm(catalogConfigs.hotels, null, {
    ...emptyForm(catalogConfigs.hotels),
    website: 'abc',
  });
  assert.ok(!result.ok);
  if (!result.ok) {
    assert.ok(result.errors.placeId);
    assert.ok(result.errors.name);
    assert.ok(result.errors.stars);
    assert.ok(result.errors.website);
    assert.equal(result.errors.priceLevel, undefined);
  }
});

test('dịch vụ: loại dịch vụ phải thuộc danh sách cho phép', () => {
  const base = { ...emptyForm(catalogConfigs.services), name: 'Tour Hạ Long' };
  assert.ok(validateForm(catalogConfigs.services, placeId, { ...base, type: 'tour' }).ok);
  assert.ok(!validateForm(catalogConfigs.services, placeId, { ...base, type: 'abc' }).ok);
  assert.ok(!validateForm(catalogConfigs.services, placeId, { ...base, type: '' }).ok);
});

test('itemToForm: danh sách được nối bằng dấu phẩy, số thành chuỗi', () => {
  const values = itemToForm(catalogConfigs.hotels, {
    name: 'A',
    stars: 5,
    priceLevel: 4,
    amenities: ['wifi', 'spa'],
    phone: undefined,
  });
  assert.equal(values.stars, '5');
  assert.equal(values.amenities, 'wifi, spa');
  assert.equal(values.phone, '');
});

test('query địa điểm: nameContains có mặc định rỗng', () => {
  assert.equal(placesQuerySchema.parse({}).nameContains, '');
  assert.equal(placesQuerySchema.parse({ nameContains: ' Hạ ' }).nameContains, 'Hạ');
});
