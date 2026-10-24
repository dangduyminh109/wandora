import 'server-only';
import { getNeo4j } from '@/lib/db/neo4j';
import type { Place } from '../types';

let constraintsInitialized = false;

export async function initPlaceGraphConstraints() {
  if (constraintsInitialized) return;
  const session = getNeo4j().session();
  try {
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
    constraintsInitialized = true;
  } finally {
    await session.close();
  }
}

export type PlaceGraphInput = Pick<Place, 'id' | 'slug' | 'name' | 'category' | 'region'> & {
  ratingAvg?: number;
  ratingCount?: number;
};

export async function upsertPlaceNode(place: PlaceGraphInput) {
  await initPlaceGraphConstraints();
  const session = getNeo4j().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (p:Place {id: $id})
        SET p.slug = $slug,
            p.name = $name,
            p.category = $category,
            p.region = $region,
            p.ratingAvg = toFloat($ratingAvg),
            p.ratingCount = toInteger($ratingCount)

        MERGE (c:Category {name: $category})
        MERGE (r:Region {name: $region})

        // Xóa quan hệ cũ nếu danh mục hoặc vùng thay đổi
        WITH p, c, r
        OPTIONAL MATCH (p)-[oldCat:IN_CATEGORY]->(cOld:Category)
        WHERE cOld.name <> $category
        DELETE oldCat

        WITH p, c, r
        OPTIONAL MATCH (p)-[oldReg:LOCATED_IN]->(rOld:Region)
        WHERE rOld.name <> $region
        DELETE oldReg

        MERGE (p)-[:IN_CATEGORY]->(c)
        MERGE (p)-[:LOCATED_IN]->(r)
        `,
        {
          id: place.id,
          slug: place.slug,
          name: place.name,
          category: place.category,
          region: place.region,
          ratingAvg: place.ratingAvg ?? 0,
          ratingCount: place.ratingCount ?? 0,
        },
      ),
    );
  } finally {
    await session.close();
  }
}

export async function deletePlaceNode(id: string) {
  const session = getNeo4j().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (p:Place {id: $id})
        DETACH DELETE p
        `,
        { id },
      ),
    );
  } finally {
    await session.close();
  }
}
