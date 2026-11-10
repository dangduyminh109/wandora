import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  amenityCodes,
  amenitySimilarities,
  deriveAmenities,
  matchAmenities,
  normalizeAmenity,
} from '../src/features/places/amenities';
import { amenitySearchQuerySchema } from '../src/features/places/schemas';

const noChildren = { hotels: [], restaurants: [], services: [] };

test('normalizeAmenity gom các cách viết về cùng một mã, không phân biệt dấu/hoa thường', () => {
  assert.equal(normalizeAmenity('Hồ bơi'), 'pool');
  assert.equal(normalizeAmenity('bể bơi vô cực'), 'pool');
  assert.equal(normalizeAmenity('POOL'), 'pool');
  assert.equal(normalizeAmenity('Khu vui chơi trẻ em'), 'amusement_park');
  assert.equal(normalizeAmenity('Cà phê'), 'cafe');
});

test('normalizeAmenity nhận mã chuẩn và bỏ qua chuỗi không liên quan', () => {
  assert.equal(normalizeAmenity('amusement_park'), 'amusement_park');
  assert.equal(normalizeAmenity('wifi'), undefined);
  assert.equal(normalizeAmenity('   '), undefined);
});

test('normalizeAmenity so khớp theo từ nguyên vẹn, không khớp nhầm chuỗi con', () => {
  assert.equal(normalizeAmenity('spaghetti'), undefined);
  assert.equal(normalizeAmenity('Spa & massage'), 'spa');
});

test('deriveAmenities suy ra từ category và tags của địa điểm', () => {
  assert.deepEqual(
    deriveAmenities({ place: { category: 'beach', tags: ['lặn biển'] }, ...noChildren }),
    ['beach'],
  );
  assert.deepEqual(
    deriveAmenities({ place: { category: 'entertainment', tags: [] }, ...noChildren }),
    ['amusement_park'],
  );
});

test('deriveAmenities gộp dữ liệu từ khách sạn, nhà hàng, dịch vụ', () => {
  const result = deriveAmenities({
    place: { category: 'city', tags: [] },
    hotels: [{ amenities: ['wifi', 'hồ bơi'] }, { amenities: ['spa', 'hồ bơi'] }],
    restaurants: [{ cuisine: ['Hải sản', 'Cà phê'] }],
    services: [{ type: 'tour' }, { type: 'other' }, { type: 'ticket' }],
  });
  assert.deepEqual(result, ['hotel', 'restaurant', 'cafe', 'pool', 'spa', 'tour', 'ticket']);
});

test('deriveAmenities không có dữ liệu con thì không có hotel/restaurant, và không trùng lặp', () => {
  const result = deriveAmenities({
    place: { category: 'beach', tags: ['bãi biển', 'beach'] },
    ...noChildren,
  });
  assert.deepEqual(result, ['beach']);
});

test('matchAmenities: khớp đủ xếp trên khớp một phần, và liệt kê tiện ích còn thiếu', () => {
  const full = matchAmenities(['pool', 'spa'], ['pool', 'spa', 'hotel'], 3);
  const partial = matchAmenities(['pool', 'spa'], ['pool'], 5);
  assert.equal(full.type, 'full');
  assert.deepEqual(full.missing, []);
  assert.equal(partial.type, 'partial');
  assert.deepEqual(partial.matched, ['pool']);
  assert.deepEqual(partial.missing, ['spa']);
  assert.ok(full.score > partial.score, 'khớp đủ phải hơn dù đánh giá thấp hơn');
});

test('matchAmenities: đánh giá chỉ phân hạng khi mức khớp ngang nhau', () => {
  const high = matchAmenities(['pool'], ['pool'], 5);
  const low = matchAmenities(['pool'], ['pool'], 3);
  assert.ok(high.score > low.score);
  // Với 10 tiện ích, khớp thêm một tiện ích luôn thắng đánh giá tối đa.
  const ten = Array.from({ length: 10 }, (_, i) => `a${i}`);
  const moreMatches = matchAmenities(ten, ten.slice(0, 6), 0);
  const betterRated = matchAmenities(ten, ten.slice(0, 5), 5);
  assert.ok(moreMatches.score > betterRated.score);
});

test('matchAmenities: không chọn tiện ích nào thì không bao giờ là khớp đủ', () => {
  assert.notEqual(matchAmenities([], ['pool']).type, 'full');
  assert.equal(matchAmenities([], ['pool']).score, 0);
});

test('amenitySearchQuerySchema: tách, khử trùng lặp, từ chối mã lạ và chuỗi rỗng', () => {
  const ok = amenitySearchQuerySchema.parse({ amenities: 'pool, hotel,pool' });
  assert.deepEqual(ok.amenities, ['pool', 'hotel']);
  assert.equal(ok.page, 0);
  assert.equal(ok.pageSize, 12);
  assert.throws(() => amenitySearchQuerySchema.parse({ amenities: 'pool,wifi' }));
  assert.throws(() => amenitySearchQuerySchema.parse({ amenities: '' }));
  assert.throws(() => amenitySearchQuerySchema.parse({}));
});

test('amenitySimilarities: mã hợp lệ, không tự nối, không trùng cặp, trọng số là bội của 0.1', () => {
  const seen = new Set<string>();
  for (const { a, b, weight } of amenitySimilarities) {
    assert.ok((amenityCodes as string[]).includes(a) && (amenityCodes as string[]).includes(b));
    assert.notEqual(a, b);
    const key = [a, b].sort().join('|');
    assert.ok(!seen.has(key), `trùng cặp ${key}`);
    seen.add(key);
    assert.ok(weight > 0 && weight < 1);
    assert.ok(
      Math.abs(weight * 10 - Math.round(weight * 10)) < 1e-9,
      `${key} không là bội của 0.1`,
    );
  }
});

test('matchAmenities: tiện ích gần giống được tính điểm một phần và gắn nhãn "similar"', () => {
  const similar = matchAmenities(['amusement_park'], ['beach'], 0, {
    amusement_park: { via: 'beach', weight: 0.4 },
  });
  assert.equal(similar.type, 'similar');
  assert.deepEqual(similar.matched, []);
  assert.deepEqual(similar.similar, [{ wanted: 'amusement_park', via: 'beach', weight: 0.4 }]);
  assert.deepEqual(similar.missing, []);
  assert.equal(similar.score, 0.4);
});

test('matchAmenities: khớp đúng một phần + gần giống phần còn lại là "partial", còn thiếu thì ghi missing', () => {
  const m = matchAmenities(['pool', 'amusement_park', 'spa'], ['pool'], 0, {
    amusement_park: { via: 'pool', weight: 0.4 },
  });
  assert.equal(m.type, 'partial');
  assert.deepEqual(m.matched, ['pool']);
  assert.deepEqual(m.missing, ['spa']);
  assert.equal(m.score, Math.round(((1 + 0.4) / 3) * 10000) / 10000);
});

test('matchAmenities: đánh giá cao không bao giờ đảo thứ hạng của hai địa điểm có mức khớp khác nhau', () => {
  const selected = Array.from({ length: 10 }, (_, i) => `a${i}`);
  const fullLowRating = matchAmenities(selected, selected, 0);
  // 9 đúng + 1 gần giống trọng số cao nhất (0.7), đánh giá tối đa: sát "khớp đủ" nhất có thể.
  const nearFull = matchAmenities(selected, selected.slice(0, 9), 5, {
    a9: { via: 'x', weight: 0.7 },
  });
  assert.equal(nearFull.type, 'partial');
  assert.ok(fullLowRating.score > nearFull.score);
});

test('matchAmenities: gần giống nhiều có thể xếp trên khớp đúng ít (xếp theo điểm, không theo nhãn)', () => {
  const selected = ['a', 'b', 'c', 'd'];
  const similarOnly = matchAmenities(selected, [], 0, {
    a: { via: 'x', weight: 0.7 },
    b: { via: 'x', weight: 0.7 },
    c: { via: 'x', weight: 0.7 },
  });
  const oneExact = matchAmenities(selected, ['a'], 0);
  assert.equal(similarOnly.type, 'similar');
  assert.equal(oneExact.type, 'partial');
  assert.ok(similarOnly.score > oneExact.score);
});

test('activityInputSchema: sự kiện tìm kiếm nhận danh sách tiện ích hợp lệ, từ chối mã lạ', async () => {
  const { activityInputSchema } = await import('../src/features/activity/schemas');
  const ok = activityInputSchema.parse({
    type: 'search',
    search: 'Tiện ích: Hồ bơi',
    amenities: ['pool'],
  });
  assert.deepEqual(ok.type === 'search' && ok.amenities, ['pool']);
  // Tìm kiếm thường (không có tiện ích) vẫn hợp lệ.
  assert.equal(activityInputSchema.safeParse({ type: 'search', search: 'biển' }).success, true);
  assert.equal(
    activityInputSchema.safeParse({ type: 'search', search: 'x', amenities: ['wifi'] }).success,
    false,
  );
});
