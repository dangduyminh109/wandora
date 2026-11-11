import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../src/lib/request-origin';

test('development accepts loopback aliases only for the configured local protocol and port', () => {
  const app = 'http://localhost:3000';
  for (const origin of ['http://127.0.0.1:3000', 'http://[::1]:3000', 'http://localhost:3000'])
    assert.equal(
      isAllowedOrigin(origin, app, 'http://127.0.0.1:3000/api/auth/register', true),
      true,
    );
  for (const origin of [
    null,
    'null',
    'https://evil.example',
    'http://localhost:3001',
    'https://127.0.0.1:3000',
    'http://localhost.evil.example:3000',
    'http://127.0.0.1:3000/path',
  ])
    assert.equal(
      isAllowedOrigin(origin, app, 'http://127.0.0.1:3000/api/auth/register', true),
      false,
    );
  assert.equal(
    isAllowedOrigin('http://127.0.0.1:3000', app, 'http://public.example:3000/api', true),
    false,
  );
});

test('production and non-local configuration retain exact origin validation', () => {
  assert.equal(
    isAllowedOrigin(
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000/api',
      false,
    ),
    false,
  );
  assert.equal(
    isAllowedOrigin(
      'https://wandora.example',
      'https://wandora.example',
      'https://wandora.example/api',
      false,
    ),
    true,
  );
  assert.equal(
    isAllowedOrigin(
      'http://localhost:3000',
      'https://wandora.example',
      'http://localhost:3000/api',
      true,
    ),
    false,
  );
});
