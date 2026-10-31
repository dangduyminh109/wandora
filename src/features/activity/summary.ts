import type { Activity } from './schemas';

export function activityDays(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
      .toISOString()
      .slice(0, 10),
  );
}
export function summarizeActivity(events: Activity[]) {
  const rank = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      .slice(0, 10);
  };
  const views = events.filter((e) => e.type === 'place_view');
  return {
    total: events.length,
    views: views.length,
    searches: events.length - views.length,
    topPlaces: rank(views.map((e) => e.placeId)),
    topCategories: rank(views.map((e) => e.category)),
    topRegions: rank(views.map((e) => e.region)),
    topSearches: rank(events.filter((e) => e.type === 'search').map((e) => e.label)),
  };
}
