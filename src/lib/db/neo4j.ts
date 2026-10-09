import neo4j, { type Driver } from 'neo4j-driver';
import { getEnv } from '@/config/env';
const globalDb = globalThis as typeof globalThis & { wandoraNeo4j?: Driver };
export function getNeo4j() {
  const env = getEnv();
  return (globalDb.wandoraNeo4j ??= neo4j.driver(
    env.NEO4J_URI,
    neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD),
  ));
}
