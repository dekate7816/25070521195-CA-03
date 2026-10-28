import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../app.js';

describe('Server API Endpoints Integration Tests', () => {
  it('serves /api/health with security headers and status 200', async () => {
    const { requestListener } = createApp();
    const server = http.createServer(requestListener);

    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      assert.equal(res.status, 200);

      // Verify security headers
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'DENY');

      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.service, 'looply-api');
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('returns 404 with structured JSON for unknown routes', async () => {
    const { requestListener } = createApp();
    const server = http.createServer(requestListener);

    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/unknown-endpoint`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.ok(data.error);
      assert.equal(data.error.status, 404);
      assert.ok(data.error.message.includes('Route not found'));
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const { requestListener } = createApp();
    const server = http.createServer(requestListener);

    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    try {
      const endpoints = [
        '/api/dashboard/summary',
        '/api/tasks',
        '/api/habits',
        '/api/categories',
        '/api/profile',
      ];

      for (const endpoint of endpoints) {
        const res = await fetch(`http://localhost:${port}${endpoint}`);
        assert.equal(res.status, 401, `Endpoint ${endpoint} must require auth`);
        const data = await res.json();
        assert.equal(data.error.status, 401);
      }
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('returns 400 for malformed JSON request body', async () => {
    const { requestListener } = createApp();
    const server = http.createServer(requestListener);

    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://localhost:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "invalidJson": broken',
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.message.includes('Malformed JSON'));
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});
