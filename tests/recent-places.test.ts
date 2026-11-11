import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recentPlaceViews } from '../src/features/activity/recent';
import type { Activity } from '../src/features/activity/schemas';

test('recent places collapse repeat visits across days and keep newest visits first', () => {
  const event = (
    placeId: string,
    occurredAt: string,
    type: Activity['type'] = 'place_view',
  ): Activity => ({
    id: occurredAt,
    userId: 'viewer',
    placeId,
    occurredAt,
    type,
    label: '',
    category: '',
    region: '',
  });
  const older = event('a'.repeat(24), '2026-11-09T22:00:00.000Z');
  const newest = event('a'.repeat(24), '2026-11-11T02:00:00.000Z');
  const other = event('b'.repeat(24), '2026-11-10T21:00:00.000Z');
  const input = [
    older,
    event('', '2026-11-11T05:00:00.000Z', 'search'),
    other,
    newest,
    event('bad-id', '2026-11-11T08:00:00.000Z'),
  ];
  assert.deepEqual(recentPlaceViews(input), [newest, other]);
  assert.equal(input[0], older, 'original events remain unchanged for statistics');
  assert.deepEqual(recentPlaceViews([]), []);
});
