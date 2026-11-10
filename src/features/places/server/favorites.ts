import 'server-only';
import { ObjectId } from 'mongodb';
import { int } from 'neo4j-driver';
import { getNeo4j } from '@/lib/db/neo4j';
import { getMongo } from '@/lib/db/mongodb';
import { HttpError } from '@/lib/http';
import type { Place } from '../types';

async function assertPlaceExists(placeId: string) {
  const place = await (
    await getMongo()
  )
    .collection('places')
    .findOne({ _id: new ObjectId(placeId) }, { projection: { _id: 1 } });
  if (!place) throw new HttpError(404, 'Không tìm thấy địa điểm.');
}

// Hai thao tác cùng người dùng chạy song song (bấm nhanh, hai tab) trước đây có thể cùng thấy "chưa
// thích" rồi cùng tạo quan hệ, sinh ra hai LIKED. Ghi vào node User ngay đầu giao dịch để Neo4j khóa
// node đó: thao tác thứ hai phải chờ rồi mới đọc trạng thái mới. Cùng cách với accountTransaction.
const LOCK_USER = 'SET u.favoritesRevision = coalesce(u.favoritesRevision, 0) + 1';

export async function toggleFavorite(
  userId: string,
  placeId: string,
): Promise<{ favorited: boolean }> {
  await assertPlaceExists(placeId);
  const session = getNeo4j().session();
  try {
    const result = await session.executeWrite(async (tx) => {
      const res = await tx.run(
        `
        MATCH (u:User {id: $userId})
        ${LOCK_USER}
        MERGE (p:Place {id: $placeId})
        WITH u, p
        OPTIONAL MATCH (u)-[r:LIKED]->(p)
        WITH u, p, collect(r) AS existing
        FOREACH (old IN existing | DELETE old)
        FOREACH (_ IN CASE WHEN size(existing) = 0 THEN [1] ELSE [] END |
          MERGE (u)-[l:LIKED]->(p) ON CREATE SET l.createdAt = datetime())
        RETURN size(existing) = 0 AS favorited
        `,
        { userId, placeId },
      );
      return res.records[0]?.get('favorited') ?? false;
    });
    return { favorited: Boolean(result) };
  } finally {
    await session.close();
  }
}

// Đảm bảo đã yêu thích (idempotent, khác toggleFavorite): dùng cho seed để chạy lại không bỏ thích.
export async function ensureFavorite(userId: string, placeId: string): Promise<void> {
  await assertPlaceExists(placeId);
  const session = getNeo4j().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (u:User {id: $userId})
        ${LOCK_USER}
        MERGE (p:Place {id: $placeId})
        MERGE (u)-[l:LIKED]->(p) ON CREATE SET l.createdAt = datetime()
        `,
        { userId, placeId },
      ),
    );
  } finally {
    await session.close();
  }
}

export async function isPlaceFavorited(userId: string, placeId: string): Promise<boolean> {
  const session = getNeo4j().session();
  try {
    const res = await session.run(
      `
      MATCH (u:User {id: $userId}), (p:Place {id: $placeId})
      RETURN EXISTS((u)-[:LIKED]->(p)) AS favorited
      `,
      { userId, placeId },
    );
    return res.records[0]?.get('favorited') ?? false;
  } finally {
    await session.close();
  }
}

export async function getPlaceFavoriteCount(placeId: string): Promise<number> {
  const session = getNeo4j().session();
  try {
    const res = await session.run(
      `
      MATCH (:User)-[r:LIKED]->(p:Place {id: $placeId})
      RETURN count(r) AS count
      `,
      { placeId },
    );
    return Number(res.records[0]?.get('count') ?? 0);
  } finally {
    await session.close();
  }
}

export async function listUserFavorites(
  userId: string,
  page = 0,
  pageSize = 12,
): Promise<{ places: Place[]; total: number }> {
  const session = getNeo4j().session();
  let placeIds: string[] = [];
  let total = 0;

  try {
    const countRes = await session.run(
      `
      MATCH (u:User {id: $userId})-[:LIKED]->(p:Place)
      RETURN count(p) AS total
      `,
      { userId },
    );
    total = Number(countRes.records[0]?.get('total') ?? 0);

    if (total > 0) {
      const listRes = await session.run(
        `
        MATCH (u:User {id: $userId})-[r:LIKED]->(p:Place)
        RETURN p.id AS id
        ORDER BY r.createdAt DESC
        SKIP $skip
        LIMIT $limit
        `,
        {
          userId,
          skip: int(page * pageSize),
          limit: int(pageSize),
        },
      );
      placeIds = listRes.records.map((rec) => rec.get('id') as string);
    }
  } finally {
    await session.close();
  }

  if (placeIds.length === 0) {
    return { places: [], total };
  }

  // Lấy dữ liệu chi tiết đầy đủ từ MongoDB
  const db = await getMongo();
  const objectIds = placeIds.map((id) => new ObjectId(id));
  const docs = await db
    .collection('places')
    .find({ _id: { $in: objectIds } })
    .toArray();

  const idMap = new Map(
    docs.map((doc) => {
      const { _id, createdAt, updatedAt, ...rest } = doc;
      delete (rest as { score?: number }).score;
      const place: Place = {
        ...rest,
        id: _id.toHexString(),
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt),
      } as Place;
      return [place.id, place];
    }),
  );

  // Giữ đúng thứ tự yêu thích mới nhất từ Neo4j
  const places: Place[] = [];
  for (const id of placeIds) {
    const item = idMap.get(id);
    if (item) places.push(item);
  }

  return { places, total };
}
