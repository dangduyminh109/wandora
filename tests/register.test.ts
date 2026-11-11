import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema } from '../src/features/auth/schemas';

const valid = {
  name: 'Người dùng mới',
  email: ' New@Example.com ',
  password: 'a-strong-password',
  confirmPassword: 'a-strong-password',
};

test('registration normalizes identity and cannot accept privileged fields', () => {
  const result = registerSchema.parse({
    ...valid,
    name: '  Người dùng mới  ',
    role: 'admin',
    status: 'active',
    authVersion: 'injected',
  });
  assert.equal(result.email, 'new@example.com');
  assert.equal(result.name, 'Người dùng mới');
  assert.equal('role' in result, false);
  assert.equal('status' in result, false);
  assert.equal('authVersion' in result, false);
});

test('registration rejects mismatched confirmation, weak passwords and invalid identity', () => {
  const mismatch = registerSchema.safeParse({ ...valid, confirmPassword: 'different-password' });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) assert.deepEqual(mismatch.error.issues[0].path, ['confirmPassword']);
  assert.equal(
    registerSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' }).success,
    false,
  );
  assert.equal(registerSchema.safeParse({ ...valid, email: 'invalid' }).success, false);
  assert.equal(registerSchema.safeParse({ ...valid, name: ' ' }).success, false);
  assert.equal(
    registerSchema.safeParse({
      ...valid,
      password: 'a'.repeat(129),
      confirmPassword: 'a'.repeat(129),
    }).success,
    false,
  );
});
