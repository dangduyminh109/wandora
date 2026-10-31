import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  activityInputSchema,
  historyQuerySchema,
  statsQuerySchema,
  type Activity,
} from '../src/features/activity/schemas';
import { activityDays, summarizeActivity } from '../src/features/activity/summary';
test('activity rejects invalid events and excludes client identity and timestamps', () => {
  assert.equal(
    activityInputSchema.safeParse({ type: 'place_view', placeId: 'bad' }).success,
    false,
  );
  assert.equal(activityInputSchema.safeParse({ type: 'search', search: '  ' }).success, false);
  assert.deepEqual(
    activityInputSchema.parse({
      type: 'search',
      search: ' biển ',
      userId: 'victim',
      occurredAt: 'fake',
    }),
    { type: 'search', search: 'biển' },
  );
});
test('history validates real dates, timeuuid cursors and bounded work', () => {
  assert.equal(historyQuerySchema.safeParse({ day: '2026-02-30' }).success, false);
  assert.equal(
    historyQuerySchema.safeParse({ before: '550e8400-e29b-41d4-a716-446655440000' }).success,
    false,
  );
  assert.equal(historyQuerySchema.safeParse({ limit: 101 }).success, false);
  assert.equal(statsQuerySchema.safeParse({ days: 31 }).success, false);
});
test('UTC buckets cross month/year boundaries without depending on local timezone', () => {
  assert.deepEqual(activityDays(3, new Date('2026-01-01T00:00:00Z')), [
    '2026-01-01',
    '2025-12-31',
    '2025-12-30',
  ]);
});
test('summary separates searches, counts repeat views and ranks preferences', () => {
  const base = {
    id: 'a',
    userId: 'u',
    occurredAt: '',
    placeId: 'p',
    label: 'Đà Lạt',
    category: 'nature',
    region: 'Lâm Đồng',
  };
  const events: Activity[] = [
    { ...base, type: 'place_view' },
    { ...base, type: 'place_view' },
    { ...base, type: 'search', placeId: '', category: '', region: '' },
  ];
  const result = summarizeActivity(events);
  assert.deepEqual([result.total, result.views, result.searches], [3, 2, 1]);
  assert.deepEqual(result.topPlaces, [{ value: 'p', count: 2 }]);
  assert.deepEqual(result.topSearches, [{ value: 'Đà Lạt', count: 1 }]);
  assert.equal(summarizeActivity([]).total, 0);
});
