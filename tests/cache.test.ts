import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCache, type CacheClient } from '../src/lib/cache-core';

function fakeClient(): CacheClient & { store: Map<string, string>; ttl: Map<string, number> } {
  const store = new Map<string, string>();
  const ttl = new Map<string, number>();
  return {
    store,
    ttl,
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value, options) {
      store.set(key, value);
      ttl.set(key, options.EX);
    },
    async incr(key) {
      const next = Number(store.get(key) ?? 0) + 1;
      store.set(key, String(next));
      return next;
    },
  };
}

test('lần đầu MISS gọi loader, lần sau HIT không gọi loader, có TTL', async () => {
  const client = fakeClient();
  const cache = createCache(
    async () => client,
    () => assert.fail('không được lỗi'),
  );
  let calls = 0;
  const load = async () => ({ n: ++calls });
  const first = await cache.cached('k', 60, load);
  const second = await cache.cached('k', 60, load);
  assert.deepEqual([first.hit, second.hit], [false, true]);
  assert.deepEqual(second.value, { n: 1 });
  assert.equal(calls, 1);
  assert.deepEqual([...client.ttl.values()], [60]);
});

test('invalidate làm khóa cũ vô hiệu, lần đọc sau nạp dữ liệu mới', async () => {
  const client = fakeClient();
  const shared = createCache(
    async () => client,
    () => undefined,
  );
  let value = 'cũ';
  await shared.cached('k', 60, async () => value);
  value = 'mới';
  assert.equal((await shared.cached('k', 60, async () => value)).value, 'cũ');
  await shared.invalidate();
  const after = await shared.cached('k', 60, async () => value);
  assert.deepEqual([after.value, after.hit], ['mới', false]);
});

test('Redis lỗi thì vẫn trả dữ liệu từ loader (fail-open)', async () => {
  let errors = 0;
  const cache = createCache(
    async () => {
      throw new Error('redis down');
    },
    () => errors++,
  );
  const result = await cache.cached('k', 60, async () => 42);
  assert.deepEqual(result, { value: 42, hit: false });
  await cache.invalidate(); // không ném lỗi
  assert.equal(errors, 2);
});

test('loader ném lỗi thì không ghi cache', async () => {
  const client = fakeClient();
  const cache = createCache(
    async () => client,
    () => undefined,
  );
  await assert.rejects(cache.cached('k', 60, async () => Promise.reject(new Error('404'))));
  assert.equal(
    [...client.store.keys()].some((k) => k.includes(':k')),
    false,
  );
});

test('keyOf: cùng tham số ra cùng khóa, khác tham số ra khóa khác', () => {
  const cache = createCache(
    async () => fakeClient(),
    () => undefined,
  );
  assert.equal(cache.keyOf('s', { a: 1 }), cache.keyOf('s', { a: 1 }));
  assert.notEqual(cache.keyOf('s', { a: 1 }), cache.keyOf('s', { a: 2 }));
});
