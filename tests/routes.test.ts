import assert from 'node:assert/strict';
import test from 'node:test';
import { homeForRole, postLoginTarget, safeRedirect } from '../src/features/auth/routes';

test('homeForRole: admin vào /admin, người dùng vào /dashboard', () => {
  assert.equal(homeForRole('admin'), '/admin');
  assert.equal(homeForRole('user'), '/dashboard');
});

test('safeRedirect chỉ nhận đường dẫn nội bộ', () => {
  assert.equal(safeRedirect('/explore/da-nang'), '/explore/da-nang');
  assert.equal(safeRedirect('//evil.com'), null);
  assert.equal(safeRedirect('/\\evil.com'), null);
  assert.equal(safeRedirect('https://evil.com'), null);
  assert.equal(safeRedirect(''), null);
  assert.equal(safeRedirect(undefined), null);
});

test('postLoginTarget: ưu tiên redirect hợp lệ, chặn user vào /admin', () => {
  assert.equal(postLoginTarget({ role: 'user' }), '/dashboard');
  assert.equal(postLoginTarget({ role: 'admin' }), '/admin');
  assert.equal(postLoginTarget({ role: 'user' }, '/explore'), '/explore');
  assert.equal(postLoginTarget({ role: 'user' }, '/admin/users'), '/dashboard');
  assert.equal(postLoginTarget({ role: 'admin' }, '/admin/users'), '/admin/users');
  assert.equal(postLoginTarget({ role: 'admin' }, '//evil.com'), '/admin');
});
