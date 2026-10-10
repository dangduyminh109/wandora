import 'server-only';
import { getRedis } from '@/lib/db/redis';
import { createCache, type CacheClient } from './cache-core';

// Thời gian sống của cache (giây). Đổi bằng biến môi trường CACHE_TTL_SECONDS nếu cần.
export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 300;

export const cache = createCache(
  async () => (await getRedis()) as unknown as CacheClient,
  () => console.error('Redis cache unavailable, falling back to MongoDB'),
);
