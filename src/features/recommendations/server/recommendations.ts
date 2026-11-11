import 'server-only';
import { ObjectId, type Filter } from 'mongodb';
import { int } from 'neo4j-driver';
import { getMongo } from '@/lib/db/mongodb';
import { getNeo4j } from '@/lib/db/neo4j';
import { toPlace, type PlaceDoc } from '@/features/places/server/places';
import type { Place } from '@/features/places/types';

export type RecommendationStrategy = 'collaborative' | 'interest' | 'content_based' | 'trending';

// Helper để tải chi tiết Place từ MongoDB theo danh sách ID và bảo toàn thứ tự điểm số
async function hydratePlaces(placeIds: string[]): Promise<Place[]> {
  if (placeIds.length === 0) return [];
  const db = await getMongo();
  const docs = await db
    .collection<PlaceDoc>('places')
    .find({ _id: { $in: placeIds.map((id) => new ObjectId(id)) } })
    .toArray();
  const byId = new Map(docs.map((doc) => [doc._id.toHexString(), toPlace(doc)]));
  return placeIds.flatMap((id) => byId.get(id) ?? []);
}

// Phương án dự phòng khi Neo4j không dùng được: địa điểm đánh giá cao nhất, đọc thẳng từ MongoDB.
// Gợi ý chỉ là phần bổ sung nên lỗi đồ thị không được làm hỏng cả trang.
async function topRatedPlaces(limit: number, filter: Filter<PlaceDoc> = {}): Promise<Place[]> {
  const docs = await (
    await getMongo()
  )
    .collection<PlaceDoc>('places')
    .find(filter)
    .sort({ ratingAvg: -1, ratingCount: -1, name: 1 })
    .limit(limit)
    .toArray();
  return docs.map(toPlace);
}

// 1. Đề xuất cá nhân hóa (Collaborative Filtering + Sở thích tiện ích + Content-based + Cold-start)
export async function getPersonalizedRecommendations(
  userId: string,
  limit = 8,
): Promise<{ places: Place[]; strategy: RecommendationStrategy }> {
  try {
    return await personalizedFromGraph(userId, limit);
  } catch (error) {
    console.error('Neo4j unavailable, personalized recommendations fall back to top rated:', error);
    return { places: await topRatedPlaces(limit), strategy: 'trending' };
  }
}

async function personalizedFromGraph(
  userId: string,
  limit: number,
): Promise<{ places: Place[]; strategy: RecommendationStrategy }> {
  const session = getNeo4j().session();
  try {
    // Bước A: Thử lọc cộng tác (Collaborative Filtering dựa trên User có sở thích tương tự)
    const cfResult = await session.run(
      `
      MATCH (me:User {id: $userId})-[r1:LIKED|RATED|VIEWED]->(p:Place)<-[r2:LIKED|RATED|VIEWED]-(other:User)
      WHERE other.id <> $userId
        AND (type(r1) <> 'RATED' OR r1.rating >= 4)
        AND (type(r2) <> 'RATED' OR r2.rating >= 4)
      WITH me, other, count(DISTINCT p) AS overlap
      MATCH (other)-[r3:LIKED|RATED|VIEWED]->(rec:Place)
      WHERE NOT (me)-[:LIKED|RATED|VIEWED]->(rec)
        AND (type(r3) <> 'RATED' OR r3.rating >= 4)
      WITH rec, other, overlap, max(CASE type(r3) WHEN 'LIKED' THEN 3 WHEN 'RATED' THEN 2 ELSE 1 END) AS strength
      WITH rec, sum(overlap * strength) AS score
      RETURN rec.id AS id, score
      ORDER BY score DESC, rec.ratingAvg DESC, rec.id ASC
      LIMIT $limit
      `,
      { userId, limit: int(limit) },
    );

    let candidateIds = cfResult.records.map((r) => r.get('id') as string);
    if (candidateIds.length > 0) {
      return {
        places: await hydratePlaces(candidateIds),
        strategy: 'collaborative',
      };
    }

    // Bước B: Sở thích tiện ích do chính người dùng thể hiện khi tìm kiếm theo tiện ích.
    // Mỗi tiện ích tính tối đa 5 lần tìm để một thói quen cũ không át hết các sở thích khác;
    // đánh giá chỉ dùng để phân hạng khi các địa điểm bằng điểm.
    const interestResult = await session.run(
      `
      MATCH (me:User {id: $userId})-[s:SEARCHED_FOR]->(a:Amenity)<-[:HAS_AMENITY]-(rec:Place)
      WHERE NOT (me)-[:LIKED|RATED|VIEWED]->(rec)
      WITH rec, sum(CASE WHEN s.count > 5 THEN 5 ELSE s.count END) AS interest
      RETURN rec.id AS id, interest + coalesce(rec.ratingAvg, 0) / 5.0 AS score
      ORDER BY score DESC, rec.ratingAvg DESC
      LIMIT $limit
      `,
      { userId, limit: int(limit) },
    );
    candidateIds = interestResult.records.map((r) => r.get('id') as string);
    if (candidateIds.length > 0) {
      return {
        places: await hydratePlaces(candidateIds),
        strategy: 'interest',
      };
    }

    // Bước C: Thử gợi ý theo nội dung (Content-based dựa trên Category và Region đã thích/đánh giá)
    const cbResult = await session.run(
      `
      MATCH (me:User {id: $userId})-[r:LIKED|RATED|VIEWED]->(p:Place)-[:IN_CATEGORY]->(c:Category)<-[:IN_CATEGORY]-(rec:Place)
      WHERE NOT (me)-[:LIKED|RATED|VIEWED]->(rec)
        AND (type(r) <> 'RATED' OR r.rating >= 4)
      OPTIONAL MATCH (rec)-[:LOCATED_IN]->(reg:Region)<-[:LOCATED_IN]-(p)
      WITH rec, (count(DISTINCT p) * 3 + count(DISTINCT reg) * 2 + coalesce(rec.ratingAvg, 0)) AS score
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
  } finally {
    await session.close();
  }

  // Bước D: Cold start (người dùng mới chưa có tương tác) -> Lấy địa điểm thịnh hành / rating cao
  return { places: await getTrendingPlaces(limit), strategy: 'trending' };
}

// 2. Đề xuất phổ biến / thịnh hành (FR14)
export async function getTrendingPlaces(limit = 8): Promise<Place[]> {
  try {
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
      return await hydratePlaces(result.records.map((rec) => rec.get('id') as string));
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j unavailable, trending places fall back to top rated:', error);
    return topRatedPlaces(limit);
  }
}

// 3. Đề xuất địa điểm liên quan cho trang chi tiết
export async function getRelatedPlaces(placeId: string, limit = 4): Promise<Place[]> {
  try {
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
      return await hydratePlaces(result.records.map((rec) => rec.get('id') as string));
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j unavailable, related places fall back to same category:', error);
    const current = await (
      await getMongo()
    )
      .collection<PlaceDoc>('places')
      .findOne({ _id: new ObjectId(placeId) }, { projection: { category: 1 } });
    if (!current) return [];
    return topRatedPlaces(limit, {
      category: current.category,
      _id: { $ne: new ObjectId(placeId) },
    });
  }
}
