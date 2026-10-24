import { closeMongo, getMongo } from '../src/lib/db/mongodb';
import { getNeo4j } from '../src/lib/db/neo4j';

async function main() {
  console.log('Bắt đầu đồng bộ Place từ MongoDB sang Neo4j...');
  const mongo = await getMongo();
  const neo4jDriver = getNeo4j();
  const session = neo4jDriver.session();

  try {
    // 1. Tạo ràng buộc duy nhất trong Neo4j
    await session.run(`
      CREATE CONSTRAINT place_id_unique IF NOT EXISTS
      FOR (p:Place) REQUIRE p.id IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT category_name_unique IF NOT EXISTS
      FOR (c:Category) REQUIRE c.name IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT region_name_unique IF NOT EXISTS
      FOR (r:Region) REQUIRE r.name IS UNIQUE
    `);

    // 2. Lấy toàn bộ địa điểm từ MongoDB
    const places = await mongo.collection('places').find({}).toArray();
    console.log(`Tìm thấy ${places.length} địa điểm trong MongoDB.`);

    if (places.length === 0) {
      console.log('MongoDB chưa có dữ liệu địa điểm. Vui lòng chạy npm run db:seed-travel trước.');
      return;
    }

    const payload = places.map((doc) => ({
      id: doc._id.toHexString(),
      slug: doc.slug,
      name: doc.name,
      category: doc.category,
      region: doc.region,
      ratingAvg: typeof doc.ratingAvg === 'number' ? doc.ratingAvg : 0,
      ratingCount: typeof doc.ratingCount === 'number' ? doc.ratingCount : 0,
    }));

    // 3. Batch UNWIND upsert vào Neo4j
    const batchSize = 100;
    for (let i = 0; i < payload.length; i += batchSize) {
      const batch = payload.slice(i, i + batchSize);
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $batch AS item
          MERGE (p:Place {id: item.id})
          SET p.slug = item.slug,
              p.name = item.name,
              p.category = item.category,
              p.region = item.region,
              p.ratingAvg = toFloat(item.ratingAvg),
              p.ratingCount = toInteger(item.ratingCount)

          MERGE (c:Category {name: item.category})
          MERGE (r:Region {name: item.region})

          MERGE (p)-[:IN_CATEGORY]->(c)
          MERGE (p)-[:LOCATED_IN]->(r)
          `,
          { batch },
        ),
      );
      console.log(`Đã đồng bộ ${Math.min(i + batchSize, payload.length)} / ${payload.length} địa điểm`);
    }

    // 4. Thống kê số lượng node trong Neo4j
    const statsResult = await session.run(`
      MATCH (p:Place) WITH count(p) as placeCount
      MATCH (c:Category) WITH placeCount, count(c) as categoryCount
      MATCH (r:Region) WITH placeCount, categoryCount, count(r) as regionCount
      RETURN placeCount, categoryCount, regionCount
    `);
    const record = statsResult.records[0];
    console.log('Đồng bộ hoàn tất! Thống kê Neo4j:');
    console.log(`- Places: ${record.get('placeCount').toString()}`);
    console.log(`- Categories: ${record.get('categoryCount').toString()}`);
    console.log(`- Regions: ${record.get('regionCount').toString()}`);
  } finally {
    await session.close();
    await neo4jDriver.close();
    await closeMongo();
  }
}

main().catch((err) => {
  console.error('Đồng bộ thất bại:', err);
  process.exitCode = 1;
});
