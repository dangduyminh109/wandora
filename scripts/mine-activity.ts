import { readActivitySnapshot } from './lib/activity-snapshot';
import { syncMinedActivitySignals } from '../src/features/activity/server/behavior-graph';
import { getNeo4j } from '../src/lib/db/neo4j';
import { closeCassandra } from '../src/lib/db/cassandra';
async function main() {
  const session = getNeo4j().session();
  try {
    const users = await session.run('MATCH (u:User) RETURN u.id AS id');
    const ids = users.records.map((record) => record.get('id') as string);
    const events = (await readActivitySnapshot()).filter((event) => ids.includes(event.userId));
    const signals = await syncMinedActivitySignals(events, ids);
    console.log(
      JSON.stringify({
        events: events.length,
        viewedRelationships: signals.views.length,
        searchedRelationships: signals.searches.length,
      }),
    );
  } finally {
    await session.close();
    await getNeo4j().close();
    await closeCassandra();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
