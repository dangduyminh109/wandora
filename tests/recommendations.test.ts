import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewInputSchema, reviewsQuerySchema } from '../src/features/places/review-schemas';

test('reviewInputSchema hợp lệ với rating từ 1 đến 5', () => {
  assert.equal(reviewInputSchema.safeParse({ rating: 5, comment: 'Tuyệt vời' }).success, true);
  assert.equal(reviewInputSchema.safeParse({ rating: 1, comment: '' }).success, true);
  assert.equal(reviewInputSchema.safeParse({ rating: 3 }).success, true);

  // Ép kiểu chuỗi số thành số
  const parsed = reviewInputSchema.parse({ rating: '4', comment: 'Đẹp' });
  assert.equal(parsed.rating, 4);
});

test('reviewInputSchema từ chối rating ngoài khoảng 1-5', () => {
  assert.equal(reviewInputSchema.safeParse({ rating: 0 }).success, false);
  assert.equal(reviewInputSchema.safeParse({ rating: 6 }).success, false);
  assert.equal(reviewInputSchema.safeParse({ rating: -1 }).success, false);
  assert.equal(reviewInputSchema.safeParse({ rating: 3.5 }).success, false);
});

test('reviewInputSchema từ chối comment quá 1000 ký tự', () => {
  const longComment = 'a'.repeat(1001);
  assert.equal(reviewInputSchema.safeParse({ rating: 5, comment: longComment }).success, false);
});

test('reviewsQuerySchema áp dụng giá trị mặc định cho phân trang', () => {
  const query = reviewsQuerySchema.parse({});
  assert.equal(query.page, 0);
  assert.equal(query.pageSize, 10);
});
