import 'server-only';
import { types } from 'cassandra-driver';
import type { z } from 'zod';
import { getCassandra } from '@/lib/db/cassandra';
import { getPlace } from '@/features/places/server/places';
import { HttpError } from '@/lib/http';
import { getRedis } from '@/lib/db/redis';
import { activityInputSchema, type Activity, type historyQuerySchema } from '../schemas';
import { activityDays, summarizeActivity } from '../summary';

export async function recordActivity(userId: string, input: z.output<typeof activityInputSchema>) {
  const attempts = await (
    await getRedis()
  ).eval(
    "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 60) end; return n",
    { keys: [`wandora:activity:${userId}`], arguments: [] },
  );
  if (Number(attempts) > 120) throw new HttpError(429, 'Vui lòng thử lại sau một phút.');
  const place = input.type === 'place_view' ? await getPlace(input.placeId) : undefined;
  const now = new Date();
  const id = types.TimeUuid.now();
  await (
    await getCassandra()
  ).execute(
    'INSERT INTO activity_by_user_day (user_id, day, event_id, occurred_at, type, place_id, label, category, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      userId,
      now.toISOString().slice(0, 10),
      id,
      now,
      input.type,
      place?.id ?? '',
      place?.name ?? (input.type === 'search' ? input.search : ''),
      place?.category ?? '',
      place?.region ?? '',
    ],
    { prepare: true, isIdempotent: true },
  );
  return id.toString();
}

export async function readHistory(userId: string, query: z.output<typeof historyQuerySchema>) {
  const params: unknown[] = [userId, query.day];
  if (query.before) params.push(types.TimeUuid.fromString(query.before));
  params.push(query.limit + 1);
  const result = await (
    await getCassandra()
  ).execute(
    `SELECT * FROM activity_by_user_day WHERE user_id = ? AND day = ?${query.before ? ' AND event_id < ?' : ''} LIMIT ?`,
    params,
    { prepare: true, fetchSize: query.limit + 1 },
  );
  const events: Activity[] = result.rows.slice(0, query.limit).map((row) => ({
    id: row.event_id.toString(),
    userId: row.user_id,
    occurredAt: row.occurred_at.toISOString(),
    type: row.type,
    placeId: row.place_id,
    label: row.label,
    category: row.category,
    region: row.region,
  }));
  return { events, next: result.rows.length > query.limit ? events.at(-1)!.id : null };
}

export async function activityStats(userId: string, days: number) {
  const dates = activityDays(days);
  const events: Activity[] = [];
  let truncated = false;
  // Bound work to 1000 events/day; never present a capped sample as a complete total.
  for (const day of dates) {
    const result = await readHistory(userId, { day, limit: 1000 });
    events.push(...result.events);
    if (result.next) truncated = true;
  }
  return { ...summarizeActivity(events), days, from: dates.at(-1), to: dates[0], truncated };
}
