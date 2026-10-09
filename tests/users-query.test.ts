import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usersQuerySchema } from '../src/features/users/schemas';
test('user listing applies pagination defaults and coerces query values', () => {
  assert.deepEqual(usersQuerySchema.parse({}), {
    page: 0,
    pageSize: 10,
    search: '',
    sortBy: 'createdAt',
    direction: 'desc',
  });
  assert.equal(
    usersQuerySchema.parse({ page: '2', pageSize: '25', search: '  member  ' }).search,
    'member',
  );
  assert.equal(usersQuerySchema.parse({ page: '2', pageSize: '25' }).page, 2);
});
test('user listing rejects invalid pagination and non-whitelisted sort fields', () => {
  for (const query of [
    { page: '-1' },
    { pageSize: '0' },
    { pageSize: '51' },
    { page: '1.5' },
    { sortBy: 'passwordHash' },
    { sortBy: 'name DESC; MATCH (u)' },
    { direction: 'sideways' },
    { search: 'x'.repeat(101) },
  ]) {
    assert.equal(usersQuerySchema.safeParse(query).success, false);
  }
});
