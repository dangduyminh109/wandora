import type { Activity } from './schemas';

export function recentPlaceViews(events: Activity[]) {
  const places = new Map<string, Activity>();
  for (const event of [...events].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))) {
    if (event.type !== 'place_view' || !/^[a-f\d]{24}$/i.test(event.placeId)) continue;
    if (!places.has(event.placeId)) places.set(event.placeId, event);
  }
  return [...places.values()];
}
