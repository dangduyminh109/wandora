import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/features/auth/server/password';
import { loginSchema } from '../src/features/auth/schemas';
import { createUserSchema } from '../src/features/users/schemas';
test('password hashes are salted and reject wrong passwords', async () => {
  const first = await hashPassword('valid-password-for-wandora');
  const second = await hashPassword('valid-password-for-wandora');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('valid-password-for-wandora', first), true);
  assert.equal(await verifyPassword('wrong-password', first), false);
  assert.equal(await verifyPassword('anything', 'malformed'), false);
});
test('user input normalizes email and rejects weak passwords and invalid roles', () => {
  const input = {
    email: 'Admin@Wandora.local',
    name: 'Wandora Admin',
    password: 'strong-password-123',
  };
  assert.equal(createUserSchema.parse(input).email, 'admin@wandora.local');
  assert.equal(createUserSchema.parse(input).role, 'user');
  assert.equal(createUserSchema.safeParse({ ...input, password: 'short' }).success, false);
  assert.equal(createUserSchema.safeParse({ ...input, role: 'owner' }).success, false);
  assert.equal(loginSchema.safeParse({ email: 'invalid', password: 'abc' }).success, false);
});

test('loginBuckets: có IP thì khóa theo cặp (email, IP) và theo IP, ngưỡng email cao hơn', async () => {
  const { loginBuckets } = await import('../src/features/auth/server/login-limits');
  const a = loginBuckets('victim@example.com', '203.0.113.5');
  assert.equal(a.length, 3);
  assert.deepEqual(
    a.map((b) => b.limit),
    [50, 10, 100],
  );
  assert.deepEqual(
    a.map((b) => b.clearOnSuccess),
    [true, true, false],
  );
  // Kẻ đoán ở IP khác có khóa cặp khác: không chặn được chủ tài khoản ở IP của họ.
  const b = loginBuckets('victim@example.com', '198.51.100.9');
  assert.equal(a[0]!.key, b[0]!.key);
  assert.notEqual(a[1]!.key, b[1]!.key);
  assert.notEqual(a[2]!.key, b[2]!.key);
  // Cặp (email, IP) khác nhau không được va nhau chỉ vì cách ghép chuỗi.
  assert.notEqual(
    loginBuckets('a|b@x.com', '1.1.1.1')[1]!.key,
    loginBuckets('a@x.com', 'b|1.1.1.1')[1]!.key,
  );
});

test('loginBuckets: không biết IP thì chỉ đếm theo email và không gộp mọi người vào một khóa', async () => {
  const { loginBuckets } = await import('../src/features/auth/server/login-limits');
  const buckets = loginBuckets('x@example.com', null);
  assert.equal(buckets.length, 1);
  assert.equal(buckets[0]!.limit, 10);
  assert.notEqual(buckets[0]!.key, loginBuckets('y@example.com', null)[0]!.key);
});

test('clientIp: lấy phần tử cuối X-Forwarded-For, bỏ giá trị không phải IP', async () => {
  const { clientIp } = await import('../src/features/auth/server/login-limits');
  const h = (init: Record<string, string>) => new Headers(init);
  assert.equal(clientIp(h({ 'x-forwarded-for': '6.6.6.6, 203.0.113.5' })), '203.0.113.5');
  assert.equal(clientIp(h({ 'x-forwarded-for': '203.0.113.5' })), '203.0.113.5');
  assert.equal(clientIp(h({ 'x-real-ip': '198.51.100.9' })), '198.51.100.9');
  assert.equal(clientIp(h({ 'x-forwarded-for': 'not-an-ip' })), null);
  assert.equal(clientIp(h({ 'x-forwarded-for': '2001:db8::1' })), '2001:db8::1');
  assert.equal(clientIp(h({})), null);
});
