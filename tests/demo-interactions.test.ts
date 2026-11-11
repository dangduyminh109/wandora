import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoInteractions, demoUsers, demoGroups } from '../scripts/seed-data/interactions';
import { mineActivitySignals } from '../src/features/activity/mining';

test('demo data has 30 named users, 100 unique reviews and exactly 1000 coherent activities', () => {
  const places = [
    'beach',
    'nature',
    'mountain',
    'culture',
    'food',
    'city',
    'entertainment',
  ].flatMap((category, group) =>
    Array.from({ length: 10 }, (_, index) => ({
      id: (group * 10 + index).toString(16).padStart(24, '0'),
      name: `${category} ${index}`,
      category,
      region: 'Đà Nẵng',
    })),
  );
  const users = demoUsers.map((user, index) => ({ ...user, id: `user-${index}` }));
  const now = new Date('2026-11-11T12:00:00.000Z');
  const data = buildDemoInteractions(places, users, now);
  assert.equal(users.length, 30);
  assert.equal(new Set(users.map((user) => user.email)).size, 30);
  assert.ok(
    users.every((user) => user.name.split(' ').length >= 3 && !/smoke|mock|test/i.test(user.email)),
  );
  assert.equal(data.reviews.length, 100);
  assert.equal(new Set(data.reviews.map((review) => review.userId + review.placeId)).size, 100);
  assert.equal(data.events.length, 1000);
  assert.equal(data.events.filter((event) => event.type === 'place_view').length, 800);
  assert.equal(data.events.filter((event) => event.type === 'search').length, 200);
  for (const user of users) {
    const activity = data.events.filter((event) => event.userId === user.id);
    assert.ok(activity.length === 33 || activity.length === 34);
    assert.ok(activity.every((event) => new Date(event.occurredAt) <= now));
    assert.ok(
      activity
        .filter((event) => event.type === 'place_view')
        .every((event) => demoGroups[user.group].categories.includes(event.category)),
    );
  }
  assert.deepEqual(
    buildDemoInteractions(places, users, now),
    data,
    'repeat generation is deterministic',
  );
  const signals = mineActivitySignals(data.events);
  assert.equal(
    signals.views.reduce((sum, view) => sum + view.count, 0),
    800,
  );
  assert.equal(
    signals.searches.reduce((sum, search) => sum + search.count, 0),
    200,
  );
  assert.ok(signals.views.every((view) => users.some((user) => user.id === view.userId)));
});

test('mining merges repeated views, retains last timestamp and separates each account', () => {
  const base = {
    id: 'event',
    userId: 'a',
    type: 'place_view' as const,
    placeId: 'a'.repeat(24),
    label: '',
    category: '',
    region: '',
  };
  const result = mineActivitySignals([
    { ...base, occurredAt: '2026-11-11T01:00:00.000Z' },
    { ...base, occurredAt: '2026-11-10T01:00:00.000Z' },
    { ...base, userId: 'b', occurredAt: '2026-11-11T02:00:00.000Z' },
    { ...base, placeId: 'invalid', occurredAt: '2026-11-11T03:00:00.000Z' },
  ]);
  assert.equal(result.views.length, 2);
  assert.deepEqual(result.views[0], {
    userId: 'a',
    placeId: base.placeId,
    count: 2,
    lastAt: '2026-11-11T01:00:00.000Z',
  });
});
