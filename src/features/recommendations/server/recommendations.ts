import 'server-only';
import { ObjectId } from 'mongodb';
import { int } from 'neo4j-driver';
import { getMongo } from '@/lib/db/mongodb';
import { getNeo4j } from '@/lib/db/neo4j';
import type { Place } from '@/features/places/types';

// Helper để tải chi tiết Place từ MongoDB theo danh sách ID và bảo toàn thứ tự điểm số
async function hydratePlaces(placeIds: string[]): Promise<Place[]> {
  if (placeIds.length === 0) return [];
  const db = await getMongo();
  const objIds = placeIds.map((id) => new ObjectId(id));
  const docs = await db
    .collection('places')
    .find({ _id: { $in: objIds } })
    .toArray();

  const map = new Map<string, Place>();
  for (const doc of docs) {
    const { _id, createdAt, updatedAt, ...rest } = doc;
    delete (rest as { score?: number }).score;
    map.set(_id.toHexString(), {
      ...rest,
      id: _id.toHexString(),
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
      updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt),
    } as Place);
  }

  const result: Place[] = [];
  for (const id of placeIds) {
    const p = map.get(id);
    if (p) result.push(p);
  }
  return result;
}

// 1. Đề xuất cá nhân hóa (Collaborative Filtering + Content-based + Cold-start fallback)
export async function getPersonalizedRecommendations(
  userId: string,
  limit = 8,
): Promise<{ places: Place[]; strategy: 'collaborative' | 'content_based' | 'trending' }> {
  const session = getNeo4j().session();
  try {
    // Bước A: Thử lọc cộng tác (Collaborative Filtering dựa trên User có sở thích tương tự)
    const cfResult = await session.run(
      `
      MATCH (me:User {id: $userId})-[r1:LIKED|RATED]->(p:Place)<-[r2:LIKED|RATED]-(other:User)-[r3:LIKED|RATED]->(rec:Place)
      WHERE other.id <> $userId AND NOT (me)-[:LIKED|RATED]->(rec)
      WITH rec, count(DISTINCT other) AS score
      RETURN rec.id AS id, score
      ORDER BY score DESC, rec.ratingAvg DESC
      LIMIT $limit
      `,
      { userId, limit: int(limit) },
    );

    let candidateIds = cfResult.records.map((r) => r.get('id') as string);
    if (candidateIds.length >= Math.min(4, limit)) {
      return {
        places: await hydratePlaces(candidateIds),
        strategy: 'collaborative',
      };
    }

    // Bước B: Thử gợi ý theo nội dung (Content-based dựa trên Category và Region đã thích/đánh giá)
    const cbResult = await session.run(
      `
      MATCH (me:User {id: $userId})-[r:LIKED|RATED]->(p:Place)-[:IN_CATEGORY]->(c:Category)<-[:IN_CATEGORY]-(rec:Place)
      WHERE NOT (me)-[:LIKED|RATED]->(rec)
      OPTIONAL MATCH (rec)-[:LOCATED_IN]->(reg:Region)<-[:LOCATED_IN]-(p)
      WITH rec, (count(DISTINCT c) + count(DISTINCT reg) * 2 + coalesce(rec.ratingAvg, 0)) AS score
      RETURN rec.id AS id, score
      ORDER BY score DESC, rec.ratingAvg DESC
      LIMIT $limit
      `,
      { userId, limit: int(limit) },
    );

    candidateIds = cbResult.records.map((r) => r.get('id') as string);
    if (candidateIds.length > 0) {
      return {
        places: await hydratePlaces(candidateIds),
        strategy: 'content_based',
      };
    }

    // Bước C: Cold start (người dùng mới chưa có tương tác) -> Lấy địa điểm thịnh hành / rating cao
    const trending = await getTrendingPlaces(limit);
    return {
      places: trending,
      strategy: 'trending',
    };
  } finally {
    await session.close();
  }
}

// 2. Đề xuất phổ biến / thịnh hành (FR14)
export async function getTrendingPlaces(limit = 8): Promise<Place[]> {
  const session = getNeo4j().session();
  try {
    const result = await session.run(
      `
      MATCH (p:Place)
      OPTIONAL MATCH (:User)-[l:LIKED]->(p)
      OPTIONAL MATCH (:User)-[r:RATED]->(p)
      WITH p, (count(DISTINCT l) * 2 + count(DISTINCT r) + coalesce(p.ratingAvg, 0)) AS score
      RETURN p.id AS id
      ORDER BY score DESC, p.ratingAvg DESC, p.name ASC
      LIMIT $limit
      `,
      { limit: int(limit) },
    );
    const ids = result.records.map((rec) => rec.get('id') as string);
    return hydratePlaces(ids);
  } finally {
    await session.close();
  }
}

// 3. Đề xuất địa điểm liên quan cho trang chi tiết
export async function getRelatedPlaces(placeId: string, limit = 4): Promise<Place[]> {
  const session = getNeo4j().session();
  try {
    const result = await session.run(
      `
      MATCH (current:Place {id: $placeId})-[:IN_CATEGORY]->(c:Category)<-[:IN_CATEGORY]-(rec:Place)
      WHERE rec.id <> $placeId
      OPTIONAL MATCH (current)-[:LOCATED_IN]->(reg:Region)<-[:LOCATED_IN]-(rec)
      WITH rec, (count(reg) * 3 + coalesce(rec.ratingAvg, 0)) AS score
      RETURN rec.id AS id
      ORDER BY score DESC, rec.ratingAvg DESC
      LIMIT $limit
      `,
      { placeId, limit: int(limit) },
    );
    const ids = result.records.map((rec) => rec.get('id') as string);
    return hydratePlaces(ids);
  } finally {
    await session.close();
  }
}
