import neo4j from 'neo4j-driver';
import { getNeo4j } from '@/lib/db/neo4j';
import { amenityCatalog, amenitySimilarities } from '../amenities';

// Không import 'server-only' để script (tsx) dùng chung được với route handler.
//
// Mô hình đồ thị:
//   (:Place)-[:HAS_AMENITY]->(:Amenity {code, label})
//   (:Amenity)-[:SIMILAR_TO {weight}]-(:Amenity)    (lưu một chiều, truy vấn vô hướng)

let initialized = false;

// Tạo ràng buộc, node Amenity và quan hệ SIMILAR_TO. Idempotent; mỗi tiến trình chỉ chạy một lần.
export async function initAmenityGraph() {
  if (initialized) return;
  const session = getNeo4j().session();
  try {
    await session.run(`
      CREATE CONSTRAINT amenity_code_unique IF NOT EXISTS
      FOR (a:Amenity) REQUIRE a.code IS UNIQUE
    `);
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        UNWIND $items AS item
        MERGE (a:Amenity {code: item.code})
        SET a.label = item.label
        `,
        { items: amenityCatalog.map(({ value, label }) => ({ code: value, label })) },
      );
      // Đồng bộ lại toàn bộ quan hệ giống nhau theo bảng trong code: xóa cái cũ rồi tạo lại.
      await tx.run('MATCH (:Amenity)-[r:SIMILAR_TO]-(:Amenity) DELETE r');
      await tx.run(
        `
        UNWIND $pairs AS pair
        MATCH (a:Amenity {code: pair.a}), (b:Amenity {code: pair.b})
        MERGE (a)-[r:SIMILAR_TO]->(b)
        SET r.weight = pair.weight
        `,
        { pairs: amenitySimilarities },
      );
    });
    initialized = true;
  } finally {
    await session.close();
  }
}

// Ghi đè tập tiện ích của nhiều địa điểm: bỏ các HAS_AMENITY không còn, thêm các cái mới.
export async function syncPlaceAmenityEdges(items: { id: string; amenities: string[] }[]) {
  if (items.length === 0) return;
  await initAmenityGraph();
  const session = getNeo4j().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $items AS item
        MATCH (p:Place {id: item.id})
        OPTIONAL MATCH (p)-[old:HAS_AMENITY]->(oldAmenity:Amenity)
        WHERE NOT oldAmenity.code IN item.amenities
        DELETE old
        WITH DISTINCT p, item
        UNWIND item.amenities AS code
        MATCH (a:Amenity {code: code})
        MERGE (p)-[:HAS_AMENITY]->(a)
        `,
        { items },
      ),
    );
  } finally {
    await session.close();
  }
}

// Người dùng vừa tìm theo các tiện ích này: tăng bộ đếm SEARCHED_FOR để làm tín hiệu sở thích.
export async function recordAmenityInterest(userId: string, codes: string[]) {
  if (codes.length === 0) return;
  await initAmenityGraph();
  const session = getNeo4j().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (u:User {id: $userId})
        UNWIND $codes AS code
        MATCH (a:Amenity {code: code})
        MERGE (u)-[r:SEARCHED_FOR]->(a)
        ON CREATE SET r.count = 1
        ON MATCH SET r.count = r.count + 1
        SET r.lastAt = datetime()
        `,
        { userId, codes },
      ),
    );
  } finally {
    await session.close();
  }
}

export type SimilarCandidate = { placeId: string; wanted: string; via: string; weight: number };

// Với mỗi (địa điểm, tiện ích muốn có) mà địa điểm CHƯA có tiện ích đó, trả về tiện ích gần giống
// tốt nhất mà địa điểm đang có.
// Gợi ý "gần giống" chỉ là phần bổ sung, nên lỗi phải nhanh: dùng session.run (không tự thử lại như
// executeRead, vốn chờ tới 30 giây khi Neo4j không kết nối được) và giới hạn tổng thời gian.
const SIMILAR_LOOKUP_TIMEOUT_MS = 3000;

export async function findSimilarCandidates(selected: string[]): Promise<SimilarCandidate[]> {
  const session = getNeo4j().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await withTimeout(
      session.run(
        `
        UNWIND $selected AS code
        MATCH (wanted:Amenity {code: code})-[r:SIMILAR_TO]-(via:Amenity)<-[:HAS_AMENITY]-(p:Place)
        WHERE NOT (p)-[:HAS_AMENITY]->(wanted)
        WITH p, wanted, via, r.weight AS weight
        ORDER BY weight DESC
        WITH p, wanted, collect({via: via.code, weight: weight})[0] AS best
        RETURN p.id AS placeId, wanted.code AS wanted, best.via AS via, best.weight AS weight
        `,
        { selected },
        { timeout: SIMILAR_LOOKUP_TIMEOUT_MS },
      ),
      SIMILAR_LOOKUP_TIMEOUT_MS,
    );
    return result.records.map((record) => ({
      placeId: record.get('placeId') as string,
      wanted: record.get('wanted') as string,
      via: record.get('via') as string,
      weight: Number(record.get('weight')),
    }));
  } finally {
    await session.close().catch(() => {});
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Neo4j không phản hồi sau ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
