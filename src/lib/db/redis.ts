import { createClient } from 'redis';
import { getEnv } from '@/config/env';
type Client = ReturnType<typeof createClient>;
const globalDb = globalThis as typeof globalThis & {
  wandoraRedis?: Client;
  wandoraRedisConnect?: Promise<unknown>;
};
export async function getRedis() {
  if (!globalDb.wandoraRedis) {
    globalDb.wandoraRedis = createClient({
      url: getEnv().REDIS_URL,
      socket: { connectTimeout: 5000, reconnectStrategy: false },
    });
    globalDb.wandoraRedis.on('error', () => console.error('Redis connection failed'));
  }
  const client = globalDb.wandoraRedis;
  if (!client.isReady) {
    globalDb.wandoraRedisConnect ??= client.connect().finally(() => {
      globalDb.wandoraRedisConnect = undefined;
    });
    await globalDb.wandoraRedisConnect;
  }
  return client;
}
