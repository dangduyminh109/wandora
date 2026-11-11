import { normalizeAmenity } from '@/features/places/amenities';
import type { Activity } from './schemas';

export function mineActivitySignals(events: Activity[]) {
  const views = new Map<
    string,
    { userId: string; placeId: string; count: number; lastAt: string }
  >();
  const searches = new Map<
    string,
    { userId: string; code: string; count: number; lastAt: string }
  >();
  for (const event of events) {
    if (event.type === 'place_view' && /^[a-f\d]{24}$/i.test(event.placeId)) {
      const key = `${event.userId}:${event.placeId}`;
      const signal = views.get(key) ?? {
        userId: event.userId,
        placeId: event.placeId,
        count: 0,
        lastAt: event.occurredAt,
      };
      signal.count++;
      if (event.occurredAt > signal.lastAt) signal.lastAt = event.occurredAt;
      views.set(key, signal);
    } else if (event.type === 'search') {
      const code = normalizeAmenity(event.label);
      if (!code) continue;
      const key = `${event.userId}:${code}`;
      const signal = searches.get(key) ?? {
        userId: event.userId,
        code,
        count: 0,
        lastAt: event.occurredAt,
      };
      signal.count++;
      if (event.occurredAt > signal.lastAt) signal.lastAt = event.occurredAt;
      searches.set(key, signal);
    }
  }
  return { views: [...views.values()], searches: [...searches.values()] };
}
