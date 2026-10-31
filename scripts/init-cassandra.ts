import { cassandraConfig, createCassandraClient } from '../src/lib/db/cassandra';
async function main() {
  const client = createCassandraClient(false);
  const { CASSANDRA_KEYSPACE: keyspace } = cassandraConfig();
  try {
    await client.execute(
      `CREATE KEYSPACE IF NOT EXISTS ${keyspace} WITH replication = {'class': 'NetworkTopologyStrategy', '${cassandraConfig().CASSANDRA_DATACENTER.replace(/'/g, "''")}': 1}`,
    );
    await client.execute(`CREATE TABLE IF NOT EXISTS ${keyspace}.activity_by_user_day (
      user_id text, day date, event_id timeuuid, occurred_at timestamp,
      type text, place_id text, label text, category text, region text,
      PRIMARY KEY ((user_id, day), event_id)
    ) WITH CLUSTERING ORDER BY (event_id DESC) AND default_time_to_live = 7776000`);
    console.log('Cassandra schema ready (90 day retention).');
  } finally {
    await client.shutdown();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
