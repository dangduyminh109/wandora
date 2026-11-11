import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { ObjectId } from 'mongodb';
import { types } from 'cassandra-driver';
import { getMongo, closeMongo } from '../src/lib/db/mongodb';
import { getNeo4j } from '../src/lib/db/neo4j';
import { getCassandra, closeCassandra } from '../src/lib/db/cassandra';
import { getRedis } from '../src/lib/db/redis';
import { hashPassword } from '../src/features/auth/server/password';
import { initPlaceGraphConstraints } from '../src/features/places/server/graph';
import { syncPlaceAmenityEdges } from '../src/features/places/server/amenity-graph';
import { syncMinedActivitySignals } from '../src/features/activity/server/behavior-graph';
import { buildDemoInteractions, demoUsers, demoGroups } from './seed-data/interactions';
import { readActivitySnapshot } from './lib/activity-snapshot';
import { backupInteractions } from './lib/backup-interactions';

type DemoSeedUser = (typeof demoUsers)[number] & {
  id: string;
  passwordHash: string;
  authVersion: string;
  role: string;
  status: string;
  phone: string;
  bio: string;
  createdAt: string;
};

async function main() {
  if (!process.argv.includes('--reset'))
    throw new Error(
      'Dùng --reset để thay tài khoản/tương tác demo cũ. Tài khoản admin và dữ liệu địa điểm được giữ lại.',
    );
  const db = await getMongo();
  const session = getNeo4j().session();
  const cassandra = await getCassandra();
  const redis = await getRedis();
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@wandora.local';
    const adminResult = await session.run(
      'MATCH (u:User {email:$email, role:"admin"}) RETURN u.id AS id',
      { email: adminEmail },
    );
    assert.equal(adminResult.records.length, 1, 'Phải xác định được đúng tài khoản admin cần giữ.');
    const adminId = adminResult.records[0].get('id') as string;
    const places = await db.collection('places').find({}).sort({ slug: 1 }).toArray();
    assert.ok(places.length >= 30, 'Cần dữ liệu địa điểm trước khi seed tương tác.');
    const now = new Date();
    const password = process.env.SEED_DEMO_PASSWORD || 'NoSql@123456789';
    const users: DemoSeedUser[] = [];
    for (const user of demoUsers)
      users.push({
        ...user,
        id: randomUUID(),
        passwordHash: await hashPassword(password),
        authVersion: randomUUID(),
        role: 'user',
        status: 'active',
        phone: '',
        bio: `Yêu thích ${demoGroups[user.group].label.toLocaleLowerCase('vi-VN')}.`,
        createdAt: new Date(now.getTime() - 45 * 86_400_000).toISOString(),
      });
    const data = buildDemoInteractions(
      places.map((place) => ({
        id: String(place._id),
        name: place.name,
        category: place.category,
        region: place.region,
      })),
      users,
      now,
    );
    assert.equal(data.reviews.length, 100);
    assert.equal(data.events.length, 1000);
    assert.equal(
      new Set(data.reviews.map((review) => review.userId + ':' + review.placeId)).size,
      100,
    );
    const backup = await backupInteractions(db, session);
    console.log('Backup:', backup);
    await initPlaceGraphConstraints();
    const adminPasswordHash = await hashPassword(password);
    await session.executeWrite(async (tx) => {
      await tx.run('MATCH (:User)-[r:LIKED|RATED|VIEWED|SEARCHED_FOR]->() DELETE r');
      await tx.run('MATCH (u:User) WHERE u.id <> $id DETACH DELETE u', { id: adminId });
      await tx.run(
        'MATCH (u:User {id:$id}) SET u.passwordHash=$hash, u.authVersion=$version, u.status="active" REMOVE u.resetTokenHash, u.resetExpiresAt',
        { id: adminId, hash: adminPasswordHash, version: randomUUID() },
      );
      await tx.run('UNWIND $users AS user CREATE (u:User) SET u = user', { users });
    });
    // Revoke app login sessions; never flush unrelated Redis data.
    for await (const keys of redis.scanIterator({ MATCH: 'wandora:session:*', COUNT: 100 })) {
      if (keys.length) await redis.del(keys);
    }
    await db.collection('reviews').deleteMany({});
    await cassandra.execute('TRUNCATE activity_by_user_day');
    await db.collection('reviews').insertMany(
      data.reviews.map((review) => ({
        ...review,
        placeId: new ObjectId(review.placeId),
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.createdAt),
      })),
    );
    await db.collection('places').updateMany({}, { $set: { ratingAvg: 0, ratingCount: 0 } });
    const ratings = await db
      .collection('reviews')
      .aggregate<{ _id: ObjectId; avg: number; count: number }>([
        { $group: { _id: '$placeId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .toArray();
    await db.collection('places').bulkWrite(
      ratings.map((rating) => ({
        updateOne: {
          filter: { _id: rating._id },
          update: {
            $set: { ratingAvg: Math.round(rating.avg * 10) / 10, ratingCount: rating.count },
          },
        },
      })),
    );
    const ratingById = new Map(ratings.map((rating) => [String(rating._id), rating]));
    await session.executeWrite(async (tx) => {
      await tx.run(
        `UNWIND $places AS item
        MERGE (p:Place {id:item.id}) SET p += item
        MERGE (c:Category {name:item.category}) MERGE (p)-[:IN_CATEGORY]->(c)
        MERGE (region:Region {name:item.region}) MERGE (p)-[:LOCATED_IN]->(region)`,
        {
          places: places.map((place) => {
            const rating = ratingById.get(String(place._id));
            return {
              id: String(place._id),
              slug: place.slug,
              name: place.name,
              category: place.category,
              region: place.region,
              ratingAvg: rating ? Math.round(rating.avg * 10) / 10 : 0,
              ratingCount: rating?.count ?? 0,
            };
          }),
        },
      );
      await tx.run(
        `UNWIND $reviews AS item
        MATCH (u:User {id:item.userId}), (p:Place {id:item.placeId})
        MERGE (u)-[r:RATED]->(p) SET r.rating=toInteger(item.rating), r.comment=item.comment, r.updatedAt=datetime(item.createdAt)`,
        { reviews: data.reviews },
      );
      await tx.run(
        `UNWIND $items AS item
        MATCH (u:User {id:item.userId}), (p:Place {id:item.placeId})
        MERGE (u)-[r:LIKED]->(p) SET r.createdAt=datetime(item.createdAt)`,
        { items: data.favorites },
      );
    });
    await syncPlaceAmenityEdges(
      places.map((place) => ({ id: String(place._id), amenities: place.amenities ?? [] })),
    );
    // Small concurrent writes avoid a cross-partition Cassandra batch.
    for (let offset = 0; offset < data.events.length; offset += 8) {
      await Promise.all(
        data.events
          .slice(offset, offset + 8)
          .map((event, index) =>
            cassandra.execute(
              'INSERT INTO activity_by_user_day (user_id, day, event_id, occurred_at, type, place_id, label, category, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                event.userId,
                event.occurredAt.slice(0, 10),
                types.TimeUuid.fromDate(new Date(event.occurredAt), offset + index),
                new Date(event.occurredAt),
                event.type,
                event.placeId,
                event.label,
                event.category,
                event.region,
              ],
              { prepare: true, isIdempotent: true },
            ),
          ),
      );
    }
    const events = await readActivitySnapshot();
    assert.equal(events.length, 1000);
    const signals = await syncMinedActivitySignals(
      events,
      users.map((user) => user.id),
    );
    await redis.incr('cache:catalog:version');
    const report =
      '# Dữ liệu người dùng và tương tác demo\n\n30 tài khoản người dùng hư cấu có tên tự nhiên, dùng địa chỉ nội bộ `@wandora.local`. Giữ nguyên tài khoản admin. Mật khẩu chung theo yêu cầu: `NoSql@123456789`.\n\n- 100 đánh giá có bình luận (mỗi cặp người dùng–địa điểm duy nhất).\n- 1.000 hoạt động trong 21 ngày: 800 lượt xem, 200 lượt tìm kiếm.\n- 5 nhóm sở thích, mỗi nhóm 6 người. Không phải dữ liệu khảo sát thực tế.\n- Cassandra giữ sự kiện; Neo4j lưu VIEWED/SEARCHED_FOR được tổng hợp từ chính các sự kiện này, cùng LIKED/RATED.\n- Gợi ý cộng tác dùng độ giao nhau giữa người dùng; thích trọng số 3, đánh giá tích cực 2, xem 1. Đánh giá dưới 4 không là tín hiệu tích cực.\n- Không gợi ý lại địa điểm đã xem/thích/đánh giá. Có dự phòng theo tiện ích, danh mục và danh sách phổ biến.\n\n| Họ tên | Email | Sở thích |\n|---|---|---|\n' +
      users
        .map((user) => `| ${user.name} | ${user.email} | ${demoGroups[user.group].label} |`)
        .join('\n') +
      '\n\nChạy lại (thay dữ liệu cũ, tự sao lưu trước): `npm run db:seed-interactions -- --reset`.\nKhai thác lại lịch sử hiện có: `npm run db:mine-activity`.\n';
    await writeFile('docs/du-lieu-demo.md', report);
    console.log(
      JSON.stringify(
        {
          admin: adminEmail,
          users: users.length,
          reviews: data.reviews.length,
          activities: events.length,
          views: events.filter((event) => event.type === 'place_view').length,
          searches: events.filter((event) => event.type === 'search').length,
          favorites: data.favorites.length,
          minedViews: signals.views.length,
          minedSearches: signals.searches.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await session.close();
    await getNeo4j().close();
    await closeMongo();
    await closeCassandra();
    await redis.quit();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
