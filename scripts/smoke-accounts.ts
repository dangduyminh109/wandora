import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { int } from 'neo4j-driver';
import { getNeo4j } from '../src/lib/db/neo4j';
import { getRedis } from '../src/lib/db/redis';
const base = process.env.APP_URL ?? 'http://localhost:3000';
type Jar = Map<string, string>;
const admin: Jar = new Map();
const member: Jar = new Map();
const ids: string[] = [];
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  jar: Jar = admin,
  origin = base,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const [key, value] = cookie.split(';')[0].split('=');
    if (value) jar.set(key, value);
    else jar.delete(key);
  }
  return response;
}
async function login(email: string, password: string, jar: Jar) {
  return request('/api/auth/login', 'POST', { email, password }, jar);
}
async function create(role: 'user' | 'admin') {
  const email = `account-test-${randomUUID()}@wandora.local`;
  const password = randomUUID();
  const response = await request('/api/users', 'POST', {
    email,
    password,
    name: 'Account test member',
    role,
  });
  assert.equal(response.status, 201);
  const user = (await response.json()).user;
  ids.push(user.id);
  return { ...user, password };
}
async function resetToken(email: string) {
  const listing = await (await fetch('http://localhost:8025/api/v1/messages')).json();
  const message = listing.messages.find(
    (item: { To: { Address: string }[]; Subject: string }) =>
      item.To.some((to) => to.Address === email) && item.Subject.includes('Đặt lại mật khẩu'),
  );
  assert.ok(message, 'Mailpit must receive the reset email');
  const detail = await (await fetch(`http://localhost:8025/api/v1/message/${message.ID}`)).json();
  const token = detail.Text.match(/#token=([a-f0-9]{64})/)?.[1];
  assert.ok(token, 'Reset email must contain a fragment token');
  return token as string;
}
async function main() {
  assert.equal(
    (await login(process.env.SEED_ADMIN_EMAIL!, process.env.SEED_ADMIN_PASSWORD!, admin)).status,
    200,
  );
  const administrator = (await (await request('/api/auth/me')).json()).user;
  const user = await create('user');
  const second = await create('user');
  assert.equal((await login(user.email, user.password, member)).status, 200);
  assert.equal((await request('/api/account/profile', 'GET', undefined, new Map())).status, 401);
  assert.equal(
    (
      await request(
        '/api/account/profile',
        'PATCH',
        {
          name: 'Updated member',
          phone: '+84 912 345 678',
          bio: 'Wandora traveller',
          role: 'admin',
          email: second.email,
        },
        member,
      )
    ).status,
    200,
  );
  const profile = (await (await request('/api/account/profile', 'GET', undefined, member)).json())
    .user;
  assert.equal(profile.role, 'user');
  assert.equal(profile.email, user.email);
  assert.equal(profile.phone, '+84 912 345 678');
  assert.equal('passwordHash' in profile, false);
  assert.equal(
    (await request(`/api/users/${second.id}`, 'PATCH', { status: 'locked' }, member)).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/api/users/${user.id}`,
        'PATCH',
        { status: 'locked' },
        admin,
        'https://untrusted.example',
      )
    ).status,
    403,
  );
  assert.equal(
    (await request(`/api/users/${user.id}`, 'PATCH', { email: second.email })).status,
    409,
  );
  assert.equal(
    (await request(`/api/users/${administrator.id}`, 'PATCH', { status: 'locked' })).status,
    400,
  );
  assert.equal(
    (await request(`/api/users/${administrator.id}`, 'PATCH', { role: 'user' })).status,
    400,
  );
  const changedPassword = randomUUID();
  const change = {
    currentPassword: 'wrong-password',
    password: changedPassword,
    confirmPassword: changedPassword,
  };
  assert.equal((await request('/api/account/password', 'POST', change, member)).status, 400);
  const beforeChange = new Map(member);
  assert.equal(
    (
      await request(
        '/api/account/password',
        'POST',
        { ...change, currentPassword: user.password },
        member,
      )
    ).status,
    200,
  );
  assert.equal((await request('/api/auth/me', 'GET', undefined, beforeChange)).status, 401);
  assert.equal((await request('/api/auth/refresh', 'POST', undefined, beforeChange)).status, 401);
  assert.equal((await login(user.email, user.password, member)).status, 401);
  assert.equal((await login(user.email, changedPassword, member)).status, 200);
  const unknown = await request(
    '/api/auth/forgot-password',
    'POST',
    { email: `absent-${randomUUID()}@wandora.local` },
    new Map(),
  );
  const known = await request(
    '/api/auth/forgot-password',
    'POST',
    { email: user.email },
    new Map(),
  );
  assert.equal(known.status, 200);
  assert.deepEqual(await known.json(), await unknown.json());
  const oldToken = await resetToken(user.email);
  const db = getNeo4j().session();
  try {
    await db.run('MATCH (u:User {id: $id}) SET u.resetExpiresAt = $expired', {
      id: user.id,
      expired: int(Date.now() - 1000),
    });
  } finally {
    await db.close();
  }
  const password = randomUUID();
  assert.equal(
    (
      await request(
        '/api/auth/reset-password',
        'POST',
        { token: oldToken, password, confirmPassword: password },
        new Map(),
      )
    ).status,
    400,
  );
  assert.equal(
    (await request('/api/auth/forgot-password', 'POST', { email: user.email }, new Map())).status,
    200,
  );
  const token = await resetToken(user.email);
  assert.notEqual(token, oldToken);
  assert.equal(
    (
      await request(
        '/api/auth/reset-password',
        'POST',
        { token: oldToken, password, confirmPassword: password },
        new Map(),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/api/auth/reset-password',
        'POST',
        { token, password, confirmPassword: 'mismatch' },
        new Map(),
      )
    ).status,
    400,
  );
  const beforeReset = new Map(member);
  const simultaneous = await Promise.all([
    request(
      '/api/auth/reset-password',
      'POST',
      { token, password, confirmPassword: password },
      new Map(),
    ),
    request(
      '/api/auth/reset-password',
      'POST',
      { token, password, confirmPassword: password },
      new Map(),
    ),
  ]);
  assert.deepEqual(simultaneous.map((item) => item.status).sort(), [200, 400]);
  assert.equal((await request('/api/auth/me', 'GET', undefined, beforeReset)).status, 401);
  assert.equal((await request('/api/auth/refresh', 'POST', undefined, beforeReset)).status, 401);
  assert.equal((await login(user.email, changedPassword, member)).status, 401);
  assert.equal((await login(user.email, password, member)).status, 200);
  const beforeLock = new Map(member);
  assert.equal((await request(`/api/users/${user.id}`, 'PATCH', { status: 'locked' })).status, 200);
  assert.equal((await request('/api/auth/me', 'GET', undefined, beforeLock)).status, 401);
  assert.equal((await request('/api/auth/refresh', 'POST', undefined, beforeLock)).status, 401);
  assert.equal((await login(user.email, password, member)).status, 401);
  assert.equal((await request(`/api/users/${user.id}`, 'PATCH', { status: 'active' })).status, 200);
  assert.equal((await request('/api/auth/refresh', 'POST', undefined, beforeLock)).status, 401);
  assert.equal((await login(user.email, password, member)).status, 200);
  const beforeRole = new Map(member);
  assert.equal((await request(`/api/users/${user.id}`, 'PATCH', { role: 'admin' })).status, 200);
  assert.equal((await request('/api/auth/me', 'GET', undefined, beforeRole)).status, 401);
  assert.equal((await login(user.email, password, member)).status, 200);
  assert.equal((await request('/api/users', 'GET', undefined, member)).status, 200);
  assert.equal(
    (await request(`/api/users/${user.id}`, 'PATCH', { role: 'user', name: 'Edited by admin' }))
      .status,
    200,
  );
  assert.equal((await request('/api/users', 'GET', undefined, member)).status, 401);
  assert.equal((await login(user.email, password, member)).status, 200);
  assert.equal((await request('/api/users', 'GET', undefined, member)).status, 403);
  assert.equal((await request(`/api/users/${user.id}`, 'GET')).status, 200);
  console.log(
    'Accounts smoke passed: profile isolation, password change, Mailpit delivery, expiry, single-use/concurrent reset, revocation, roles, lock/unlock, duplicate email and self-protection.',
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!ids.length) return;
    await request('/api/auth/logout', 'POST');
    const session = getNeo4j().session();
    try {
      await session.run('MATCH (u:User) WHERE u.id IN $ids DETACH DELETE u', { ids });
    } finally {
      await session.close();
      await getNeo4j().close();
    }
    const redis = await getRedis();
    // Only revoke session records for the disposable accounts created by this test.
    for await (const keys of redis.scanIterator({ MATCH: 'wandora:session:*', COUNT: 100 })) {
      for (const key of keys) {
        const value = await redis.get(key);
        if (value && ids.includes(JSON.parse(value).userId)) await redis.del(key);
      }
    }
    await redis.quit();
  })
  .catch((error) => {
    console.error('Test cleanup failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
