import { performance } from 'node:perf_hooks';
import { closeMongo, getMongo } from '../src/lib/db/mongodb';
import { getRedis } from '../src/lib/db/redis';
import { placesQuerySchema } from '../src/features/places/schemas';
import { searchPlaces } from '../src/features/places/server/places';
import { getPlaceDetail } from '../src/features/places/server/detail';

// Đo thời gian trả lời khi KHÔNG cache (đọc MongoDB) và khi CÓ cache (đọc Redis).
// Chạy: npm run bench:cache   (cần MongoDB + Redis đang chạy và đã seed dữ liệu)
const RUNS = Number(process.env.BENCH_RUNS) || 200;

const queries = [
  { name: 'Tìm "biển"', query: { search: 'biển' } },
  { name: 'Tìm "hang động"', query: { search: 'hang động' } },
  {
    name: 'Lọc Biển + Đà Nẵng, đánh giá ≥ 4',
    query: { category: 'beach', region: 'Đà Nẵng', minRating: '4' },
  },
  { name: 'Danh sách, xếp theo đánh giá', query: { sortBy: 'ratingAvg' } },
];

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;

async function measure(run: () => Promise<unknown>) {
  const times: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    await run();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
  };
}

const fmt = (n: number) => n.toFixed(2);

async function main() {
  const redis = await getRedis();
  const rows: Record<string, string | number>[] = [];
  const cases: { name: string; direct: () => Promise<unknown>; cached: () => Promise<unknown> }[] =
    queries.map(({ name, query }) => {
      const parsed = placesQuerySchema.parse(query);
      return {
        name,
        direct: () => searchPlaces(parsed, { useCache: false }),
        cached: () => searchPlaces(parsed),
      };
    });

  const sample = await (
    await getMongo()
  )
    .collection('places')
    .findOne({}, { projection: { slug: 1 } });
  if (!sample) throw new Error('Chưa có dữ liệu. Chạy: npm run db:seed-travel');
  cases.push({
    name: 'Chi tiết địa điểm + khách sạn/nhà hàng/dịch vụ',
    direct: () => getPlaceDetail(sample.slug, { useCache: false }),
    cached: () => getPlaceDetail(sample.slug),
  });

  // Chỉ xóa khóa cache; không đụng tới phiên đăng nhập lưu trong cùng Redis.
  for await (const keys of redis.scanIterator({ MATCH: 'cache:*', COUNT: 200 })) {
    if (keys.length) await redis.del(keys);
  }
  for (const item of cases) {
    await item.direct(); // khởi động kết nối
    const noCache = await measure(item.direct);
    await item.cached(); // lần đầu: miss, nạp vào Redis
    const withCache = await measure(item.cached);
    rows.push({
      'Truy vấn': item.name,
      'Không cache TB (ms)': fmt(noCache.avg),
      'Không cache P95 (ms)': fmt(noCache.p95),
      'Có cache TB (ms)': fmt(withCache.avg),
      'Có cache P95 (ms)': fmt(withCache.p95),
      'Nhanh hơn (lần)': fmt(noCache.avg / withCache.avg),
    });
  }
  console.log(`\nSố lần đo mỗi truy vấn: ${RUNS}`);
  console.table(rows);
}
main()
  .catch((error) => {
    console.error('Đo thất bại:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongo();
    (await getRedis().catch(() => null))?.destroy();
  });
