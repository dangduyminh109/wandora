import 'server-only';
import { ObjectId, type WithId } from 'mongodb';
import { cache } from '@/lib/cache';
import { getMongo } from '@/lib/db/mongodb';
import { getNeo4j } from '@/lib/db/neo4j';
import { HttpError } from '@/lib/http';

export type Review = {
  id: string;
  placeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewDoc = {
  placeId: ObjectId;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
};

function toReview(doc: WithId<ReviewDoc>): Review {
  const { _id, placeId, createdAt, updatedAt, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
    placeId: placeId.toHexString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

async function reviewsCollection() {
  return (await getMongo()).collection<ReviewDoc>('reviews');
}

async function recalculatePlaceRating(placeId: string) {
  const db = await getMongo();
  const objId = new ObjectId(placeId);

  const [stats] = await db
    .collection('reviews')
    .aggregate([
      { $match: { placeId: objId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    .toArray();

  const ratingAvg = stats ? Math.round(stats.avg * 10) / 10 : 0;
  const ratingCount = stats ? (stats.count as number) : 0;

  // 1. Cập nhật MongoDB
  await db
    .collection('places')
    .updateOne({ _id: objId }, { $set: { ratingAvg, ratingCount, updatedAt: new Date() } });

  // 2. Cập nhật Neo4j
  const neo4jSession = getNeo4j().session();
  try {
    await neo4jSession.executeWrite((tx) =>
      tx.run(
        `
        MATCH (p:Place {id: $placeId})
        SET p.ratingAvg = toFloat($ratingAvg),
            p.ratingCount = toInteger($ratingCount)
        `,
        { placeId, ratingAvg, ratingCount },
      ),
    );
  } finally {
    await neo4jSession.close();
  }

  // 3. Xóa cache Redis
  await cache.invalidate();

  return { ratingAvg, ratingCount };
}

export async function createOrUpdateReview(
  placeId: string,
  user: { id: string; name: string },
  input: { rating: number; comment: string },
): Promise<Review> {
  const collection = await reviewsCollection();
  const objPlaceId = new ObjectId(placeId);
  const now = new Date();

  // Kiểm tra place có tồn tại trong MongoDB không
  const place = await (await getMongo()).collection('places').findOne({ _id: objPlaceId });
  if (!place) throw new HttpError(404, 'Không tìm thấy địa điểm.');

  // 1. Lưu/cập nhật MongoDB review
  const doc = await collection.findOneAndUpdate(
    { placeId: objPlaceId, userId: user.id },
    {
      $set: {
        userName: user.name,
        rating: input.rating,
        comment: input.comment,
        updatedAt: now,
      },
      $setOnInsert: {
        placeId: objPlaceId,
        userId: user.id,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  if (!doc) throw new HttpError(500, 'Không thể lưu đánh giá.');

  // 2. Tính lại điểm trung bình địa điểm
  const { ratingAvg, ratingCount } = await recalculatePlaceRating(placeId);

  // 3. Cập nhật quan hệ RATED trên Neo4j
  const neo4jSession = getNeo4j().session();
  try {
    await neo4jSession.executeWrite((tx) =>
      tx.run(
        `
        MATCH (u:User {id: $userId})
        MERGE (p:Place {id: $placeId})
        MERGE (u)-[r:RATED]->(p)
        SET r.rating = toInteger($rating),
            r.comment = $comment,
            r.updatedAt = datetime(),
            p.ratingAvg = toFloat($ratingAvg),
            p.ratingCount = toInteger($ratingCount)
        `,
        {
          userId: user.id,
          placeId,
          rating: input.rating,
          comment: input.comment,
          ratingAvg,
          ratingCount,
        },
      ),
    );
  } finally {
    await neo4jSession.close();
  }

  return toReview(doc);
}

export async function listReviews(
  placeId: string,
  page = 0,
  pageSize = 10,
): Promise<{ reviews: Review[]; total: number }> {
  const collection = await reviewsCollection();
  const filter = { placeId: new ObjectId(placeId) };

  const [docs, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return { reviews: docs.map(toReview), total };
}

export async function getUserReviewForPlace(
  placeId: string,
  userId: string,
): Promise<Review | null> {
  const collection = await reviewsCollection();
  const doc = await collection.findOne({
    placeId: new ObjectId(placeId),
    userId,
  });
  return doc ? toReview(doc) : null;
}

export async function deleteReview(placeId: string, userId: string): Promise<void> {
  const collection = await reviewsCollection();
  const objPlaceId = new ObjectId(placeId);

  const res = await collection.deleteOne({ placeId: objPlaceId, userId });
  if (res.deletedCount === 0) {
    throw new HttpError(404, 'Không tìm thấy đánh giá để xóa.');
  }

  // 1. Tính lại điểm trung bình
  await recalculatePlaceRating(placeId);

  // 2. Xóa quan hệ RATED trên Neo4j
  const neo4jSession = getNeo4j().session();
  try {
    await neo4jSession.executeWrite((tx) =>
      tx.run(
        `
        MATCH (u:User {id: $userId})-[r:RATED]->(p:Place {id: $placeId})
        DELETE r
        `,
        { userId, placeId },
      ),
    );
  } finally {
    await neo4jSession.close();
  }
}
