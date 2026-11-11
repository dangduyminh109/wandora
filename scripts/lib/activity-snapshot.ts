import { getCassandra } from '../../src/lib/db/cassandra';
import type { Activity } from '../../src/features/activity/schemas';

export async function readActivitySnapshot() {
  const cassandra = await getCassandra();
  const events: Activity[] = [];
  let pageState: string | undefined;
  do {
    const result = await cassandra.execute('SELECT * FROM activity_by_user_day', [], {
      fetchSize: 1000,
      pageState,
    });
    events.push(
      ...result.rows.map((row) => ({
        id: row.event_id.toString(),
        userId: row.user_id,
        occurredAt: row.occurred_at.toISOString(),
        type: row.type,
        placeId: row.place_id ?? '',
        label: row.label ?? '',
        category: row.category ?? '',
        region: row.region ?? '',
      })),
    );
    pageState = result.pageState;
  } while (pageState);
  return events;
}
