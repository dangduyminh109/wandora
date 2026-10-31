import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createUser } from '../src/features/auth/server/users';
import { getNeo4j } from '../src/lib/db/neo4j';
import { closeCassandra, getCassandra } from '../src/lib/db/cassandra';
import { getRedis } from '../src/lib/db/redis';
import type { Activity } from '../src/features/activity/schemas';
import { getMongo, closeMongo } from '../src/lib/db/mongodb';
import type { ObjectId } from 'mongodb';

const base = process.env.APP_URL ?? 'http://localhost:3000';
const users: string[] = [];
const jars: Map<string, string>[] = [];
let testPlaceId: ObjectId | undefined;
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  jar = new Map<string, string>(),
  origin = base,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const [name, value] = cookie.split(';')[0].split('=');
    if (value) jar.set(name, value);
    else jar.delete(name);
  }
  return response;
}
async function main() {
  assert.equal((await request('/api/activity')).status, 401);
  assert.equal((await request('/api/activity/stats')).status, 401);
  for (let i = 0; i < 2; i++) {
    const password = randomUUID();
    const user = await createUser({
      email: `activity-${randomUUID()}@wandora.local`,
      name: 'Activity integration test',
      password,
      role: 'user',
    });
    users.push(user.id);
    const jar = new Map<string, string>();
    jars.push(jar);
    assert.equal(
      (await request('/api/auth/login', 'POST', { email: user.email, password }, jar)).status,
      200,
    );
  }
  const [member, other] = jars;
  assert.equal(
    (
      await request(
        '/api/activity',
        'POST',
        { type: 'search', search: 'biển' },
        member,
        'https://invalid.example',
      )
    ).status,
    403,
  );
  assert.equal(
    (await request('/api/activity', 'POST', { type: 'search', search: '' }, member)).status,
    400,
  );
  for (const search of ['biển', 'Đà Lạt', 'biển']) {
    assert.equal(
      (await request('/api/activity', 'POST', { type: 'search', search, userId: users[1] }, member))
        .status,
      201,
    );
  }
  const day = new Date().toISOString().slice(0, 10);
  const first = await request(`/api/activity?day=${day}&limit=2`, 'GET', undefined, member);
  assert.equal(first.status, 200);
  const history = (await first.json()) as { events: Activity[]; next: string };
  assert.equal(history.events.length, 2);
  assert.ok(history.next);
  assert.ok(history.events.every((event) => event.userId === users[0]));
  const second = await (
    await request(
      `/api/activity?day=${day}&limit=2&before=${history.next}`,
      'GET',
      undefined,
      member,
    )
  ).json();
  assert.equal(second.events.length, 1);
  assert.equal(second.next, null);
  assert.equal(new Set([...history.events, ...second.events].map((event) => event.id)).size, 3);
  const isolated = await (
    await request(`/api/activity?userId=${users[0]}`, 'GET', undefined, other)
  ).json();
  assert.deepEqual(isolated.events, []);
  const stats = await (
    await request('/api/activity/stats?days=7', 'GET', undefined, member)
  ).json();
  assert.equal(stats.searches, 3);
  assert.deepEqual(stats.topSearches[0], { value: 'biển', count: 2 });
  assert.equal(stats.truncated, false);
  const now = new Date();
  const place = await (await getMongo()).collection('places').insertOne({
    name: 'Activity smoke destination',
    slug: `activity-smoke-${randomUUID()}`,
    category: 'nature',
    region: 'Test region',
    address: '',
    description: '',
    location: { type: 'Point', coordinates: [108, 16] },
    images: [],
    tags: [],
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  testPlaceId = place.insertedId;
  assert.equal(
    (
      await request(
        '/api/activity',
        'POST',
        { type: 'place_view', placeId: testPlaceId.toHexString(), label: 'Spoofed name' },
        member,
      )
    ).status,
    201,
  );
  const viewed = await (await request('/api/activity?limit=1', 'GET', undefined, member)).json();
  assert.equal(viewed.events[0].label, 'Activity smoke destination');
  const withView = await (
    await request('/api/activity/stats?days=7', 'GET', undefined, member)
  ).json();
  assert.equal(withView.views, 1);
  assert.deepEqual(withView.topRegions, [{ value: 'Test region', count: 1 }]);
  assert.equal(
    (await request('/api/activity?day=2026-02-30', 'GET', undefined, member)).status,
    400,
  );
  console.log(
    'Activity integration passed: auth, origin, validation, persistence, pagination, isolation and statistics.',
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (testPlaceId)
        await (await getMongo()).collection('places').deleteOne({ _id: testPlaceId });
      for (const jar of jars) await request('/api/auth/logout', 'POST', undefined, jar);
      if (users.length) {
        const client = await getCassandra();
        for (const id of users) {
          // Cover a test run crossing UTC midnight.
          for (const date of [new Date(), new Date(Date.now() - 86400000)]) {
            await client.execute(
              'DELETE FROM activity_by_user_day WHERE user_id = ? AND day = ?',
              [id, date.toISOString().slice(0, 10)],
              { prepare: true },
            );
          }
        }
      }
    } finally {
      const session = getNeo4j().session();
      try {
        await session.run('MATCH (u:User) WHERE u.id IN $ids DETACH DELETE u', { ids: users });
      } finally {
        await session.close();
        await getNeo4j().close();
        await closeCassandra();
        await closeMongo();
        await (await getRedis()).quit();
      }
    }
  });
