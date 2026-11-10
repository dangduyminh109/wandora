import 'server-only';
import { ObjectId } from 'mongodb';
import { int } from 'neo4j-driver';
import { getNeo4j } from '@/lib/db/neo4j';
import { getMongo } from '@/lib/db/mongodb';
import { HttpError } from '@/lib/http';
import type { Place } from '../types';

export async function toggleFavorite(
  userId: string,
  placeId: string,
): Promise<{ favorited: boolean }> {
  const db = await getMongo();
  const place = await db.collection('places').findOne({ _id: new ObjectId(placeId) });
  if (!place) throw new HttpError(404, 'Không tìm thấy địa điểm.');

  const session = getNeo4j().session();
  try {
    const result = await session.executeWrite(async (tx) => {
      const res = await tx.run(
        `
        MATCH (u:User {id: $userId})
        MERGE (p:Place {id: $placeId})
        WITH u, p
        OPTIONAL MATCH (u)-[r:LIKED]->(p)
        WITH u, p, r
        FOREACH (_ IN CASE WHEN r IS NOT NULL THEN [1] ELSE [] END | DELETE r)
        FOREACH (_ IN CASE WHEN r IS NULL THEN [1] ELSE [] END | CREATE (u)-[:LIKED {createdAt: datetime()}]->(p))
        RETURN r IS NULL AS favorited
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
