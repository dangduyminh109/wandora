import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  changePasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
} from '../src/features/account/schemas';
test('password changes reject mismatch, short passwords and unchanged passwords', () => {
  const input = {
    currentPassword: 'old-password-for-wandora',
    password: 'new-password-for-wandora',
    confirmPassword: 'new-password-for-wandora',
  };
  assert.equal(changePasswordSchema.safeParse(input).success, true);
  assert.equal(
    changePasswordSchema.safeParse({ ...input, confirmPassword: 'different' }).success,
    false,
  );
  assert.equal(
    changePasswordSchema.safeParse({ ...input, password: 'short', confirmPassword: 'short' })
      .success,
    false,
  );
  assert.equal(
    changePasswordSchema.safeParse({
      ...input,
      password: input.currentPassword,
      confirmPassword: input.currentPassword,
    }).success,
    false,
  );
});
test('reset requires a well-formed token and admin patches cannot write internal fields', () => {
  assert.equal(
    resetPasswordSchema.safeParse({
      token: 'a'.repeat(64),
      password: 'new-password-for-wandora',
      confirmPassword: 'new-password-for-wandora',
    }).success,
    true,
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'new-password-for-wandora',
      confirmPassword: 'new-password-for-wandora',
    }).success,
    false,
  );
  assert.equal(updateUserSchema.safeParse({ status: 'locked' }).success, true);
  assert.equal(updateUserSchema.safeParse({}).success, false);
  assert.equal(updateUserSchema.safeParse({ authVersion: 'forged', role: 'admin' }).success, false);
});
