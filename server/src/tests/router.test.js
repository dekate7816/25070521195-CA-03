import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from '../router/index.js';

describe('Native HTTP Router Tests', () => {
  it('registers and matches static routes', () => {
    const router = new Router();
    router.get('/api/health', (req, res) => {});

    const matched = router.match('GET', '/api/health');
    assert.ok(matched, 'Route should match');
    assert.deepEqual(matched.params, {});

    const unmatchedMethod = router.match('POST', '/api/health');
    assert.equal(unmatchedMethod, null, 'Method mismatch should not match');

    const unmatchedPath = router.match('GET', '/api/nonexistent');
    assert.equal(unmatchedPath, null, 'Unregistered route should return null');
  });

  it('matches dynamic parameters in paths', () => {
    const router = new Router();
    router.get('/api/tasks/:id', (req, res) => {});
    router.put('/api/habits/:id/completions/:date', (req, res) => {});

    const taskMatch = router.match('GET', '/api/tasks/671fe2a3b91c2d0012e84123');
    assert.ok(taskMatch);
    assert.equal(taskMatch.params.id, '671fe2a3b91c2d0012e84123');

    const habitMatch = router.match('PUT', '/api/habits/habit123/completions/2026-10-28');
    assert.ok(habitMatch);
    assert.equal(habitMatch.params.id, 'habit123');
    assert.equal(habitMatch.params.date, '2026-10-28');
  });

  it('normalizes trailing slashes cleanly', () => {
    const router = new Router();
    router.get('/api/tasks', (req, res) => {});

    const matchedWithSlash = router.match('GET', '/api/tasks/');
    assert.ok(matchedWithSlash, 'Trailing slash should be normalized and matched');
  });

  it('parses request cookie headers', () => {
    const router = new Router();
    const req = {
      headers: {
        cookie: 'looply_session=abc123token; other_cookie=hello%20world',
      },
    };

    const cookies = router.parseCookies(req);
    assert.equal(cookies.looply_session, 'abc123token');
    assert.equal(cookies.other_cookie, 'hello world');
  });
});
