import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = process.env.APP_URL ?? 'http://localhost:3000';
const jar = new Map<string, string>();
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  cookieJar = jar,
  origin = base,
) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      Cookie: [...cookieJar].map(([key, value]) => `${key}=${value}`).join('; '),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const value of response.headers.getSetCookie()) {
    const [name, content] = value.split(';')[0].split('=');
    if (content) cookieJar.set(name, content);
    else cookieJar.delete(name);
  }
  return response;
}
async function main() {
  assert.equal((await request('/api/auth/me')).status, 401);
  assert.equal((await request('/api/users')).status, 401);
  assert.equal(
    (await request('/api/auth/login', 'POST', {}, jar, 'https://untrusted.example')).status,
    403,
  );
  assert.equal(
    (
      await request('/api/auth/login', 'POST', {
        email: process.env.SEED_ADMIN_EMAIL,
        password: 'incorrect-password',
      })
    ).status,
    401,
  );
  const login = await request('/api/auth/login', 'POST', {
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.role, 'admin');
  assert.ok(
    login.headers
      .getSetCookie()
      .every((value) => value.includes('HttpOnly') && value.includes('SameSite=lax')),
  );
  assert.equal((await request('/api/auth/me')).status, 200);
  const oldJar = new Map(jar);
  assert.equal((await request('/api/auth/refresh', 'POST')).status, 200);
  assert.notEqual(oldJar.get('wandora_refresh'), jar.get('wandora_refresh'));
  assert.equal((await request('/api/auth/refresh', 'POST', undefined, oldJar)).status, 401);
  const email = `smoke-${randomUUID()}@wandora.local`;
  const password = randomUUID();
  const data = { email, password, name: 'Smoke test member', role: 'user' };
  const created = await request('/api/users', 'POST', data);
  assert.equal(created.status, 201);
  assert.equal('passwordHash' in (await created.json()).user, false);
  assert.equal((await request('/api/users', 'POST', data)).status, 409);
  const listing = await request(
    `/api/users?search=${encodeURIComponent(email)}&pageSize=5&sortBy=email&direction=asc`,
  );
  assert.equal(listing.status, 200);
  const listed = await listing.json();
  assert.equal(listed.total, 1);
  assert.equal(listed.users.length, 1);
  assert.equal(listed.users[0].email, email);
  assert.equal('passwordHash' in listed.users[0], false);
  const beyond = await request(`/api/users?search=${encodeURIComponent(email)}&page=1&pageSize=5`);
  assert.equal(beyond.status, 200);
  assert.equal((await beyond.json()).users.length, 0);
  assert.equal((await request('/api/users?pageSize=500')).status, 400);
  assert.equal((await request('/api/users?sortBy=passwordHash')).status, 400);
  const beforeLogout = new Map(jar);
  assert.equal((await request('/api/auth/logout', 'POST')).status, 200);
  assert.equal((await request('/api/auth/me', 'GET', undefined, beforeLogout)).status, 401);
  assert.equal((await request('/api/auth/refresh', 'POST', undefined, beforeLogout)).status, 401);
  assert.equal((await request('/api/auth/login', 'POST', { email, password })).status, 200);
  assert.equal((await request('/api/users', 'POST', data)).status, 403);
  assert.equal((await request('/api/users')).status, 403);
  assert.equal((await request('/api/auth/logout', 'POST')).status, 200);
  console.log(
    'Smoke passed: auth rotation/revocation, admin creation, user listing/search/pagination, query validation and role enforcement.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
