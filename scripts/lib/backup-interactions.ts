import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BSON, type Db } from 'mongodb';
import type { Session } from 'neo4j-driver';
import { readActivitySnapshot } from './activity-snapshot';

export async function backupInteractions(db: Db, session: Session) {
  const folder = path.resolve('data/seed-backups', new Date().toISOString().replaceAll(':', '-'));
  const users = await session.run('MATCH (u:User) RETURN properties(u) AS user');
  const relationships = await session.run(
    'MATCH (u:User)-[r]->(n) RETURN u.id AS userId, type(r) AS type, labels(n) AS targetLabels, properties(n) AS target, properties(r) AS properties',
  );
  const reviews = await db.collection('reviews').find({}).toArray();
  const places = await db
    .collection('places')
    .find({}, { projection: { ratingAvg: 1, ratingCount: 1, updatedAt: 1 } })
    .toArray();
  const activity = await readActivitySnapshot();
  await mkdir(folder, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(folder, 'users-and-relationships.json'),
      JSON.stringify(
        {
          users: users.records.map((r) => r.get('user')),
          relationships: relationships.records.map((r) => r.toObject()),
        },
        null,
        2,
      ),
    ),
    writeFile(path.join(folder, 'reviews.ejson'), BSON.EJSON.stringify(reviews, null, 2)),
    writeFile(path.join(folder, 'place-ratings.ejson'), BSON.EJSON.stringify(places, null, 2)),
    writeFile(path.join(folder, 'activity.json'), JSON.stringify(activity, null, 2)),
  ]);
  return folder;
}
