import { Client } from 'cassandra-driver';
import { z } from 'zod';

export function cassandraConfig() {
  return z
    .object({
      CASSANDRA_CONTACT_POINTS: z.string().default('127.0.0.1'),
      CASSANDRA_DATACENTER: z.string().default('datacenter1'),
      CASSANDRA_KEYSPACE: z
        .string()
        .regex(/^[a-z][a-z0-9_]{0,47}$/)
        .default('wandora'),
    })
    .parse(process.env);
}

export function createCassandraClient(withKeyspace = true) {
  const env = cassandraConfig();
  return new Client({
    // Compose binds IPv4 loopback; Node may otherwise resolve localhost to ::1.
    contactPoints: env.CASSANDRA_CONTACT_POINTS.split(',').map((s) =>
      s.trim() === 'localhost' ? '127.0.0.1' : s.trim(),
    ),
    localDataCenter: env.CASSANDRA_DATACENTER,
    ...(withKeyspace ? { keyspace: env.CASSANDRA_KEYSPACE } : {}),
    socketOptions: { connectTimeout: 5000, readTimeout: 5000 },
  });
}

const shared = globalThis as typeof globalThis & { wandoraCassandra?: Promise<Client> };
export async function getCassandra() {
  shared.wandoraCassandra ??= (async () => {
    const client = createCassandraClient();
    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.shutdown();
      throw error;
    }
  })().catch((error) => {
    shared.wandoraCassandra = undefined;
    throw error;
  });
  return shared.wandoraCassandra;
}
export async function closeCassandra() {
  const pending = shared.wandoraCassandra;
  shared.wandoraCassandra = undefined;
  if (pending) await (await pending).shutdown();
}
