import { getNeo4j } from '@/lib/db/neo4j';
import { initAmenityGraph } from '@/features/places/server/amenity-graph';
import { mineActivitySignals } from '../mining';
import type { Activity } from '../schemas';

export async function recordPlaceViewInterest(userId: string, placeId: string, occurredAt: Date) {
  const session = getNeo4j().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
      MATCH (u:User {id:$userId}), (p:Place {id:$placeId})
      MERGE (u)-[v:VIEWED]->(p)
      SET v.count = coalesce(v.count, 0) + 1, v.lastAt = datetime($lastAt)
    `,
        { userId, placeId, lastAt: occurredAt.toISOString() },
      ),
    );
  } finally {
    await session.close();
  }
}

export async function syncMinedActivitySignals(events: Activity[], userIds: string[]) {
  await initAmenityGraph();
  const signals = mineActivitySignals(events);
  const session = getNeo4j().session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run('MATCH (u:User)-[r:VIEWED|SEARCHED_FOR]->() WHERE u.id IN $userIds DELETE r', {
        userIds,
      });
      await tx.run(
        `UNWIND $items AS item
        MATCH (u:User {id:item.userId}), (p:Place {id:item.placeId})
        MERGE (u)-[r:VIEWED]->(p)
        SET r.count=toInteger(item.count), r.lastAt=datetime(item.lastAt)`,
        { items: signals.views },
      );
      await tx.run(
        `UNWIND $items AS item
        MATCH (u:User {id:item.userId}), (a:Amenity {code:item.code})
        MERGE (u)-[r:SEARCHED_FOR]->(a)
        SET r.count=toInteger(item.count), r.lastAt=datetime(item.lastAt)`,
        { items: signals.searches },
      );
    });
  } finally {
    await session.close();
  }
  return signals;
}
