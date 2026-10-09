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
