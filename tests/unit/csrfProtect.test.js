'use strict';

/**
 * Unit tests for the csrfProtect wrapper in server/middleware/csrf.js.
 * The wrapper adds (a) a NODE_ENV==='test' bypass, and (b) a clean JSON 403
 * response in place of csrf-csrf's default http-errors throw.
 *
 * NODE_ENV is read at call-time inside the wrapper, so toggling it between
 * tests does not require re-requiring the module.
 */
const express      = require('express');
const request      = require('supertest');
const cookieParser = require('cookie-parser');

const { csrfProtect, generateCsrfToken } = require('../../server/middleware/csrf');

function buildApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.get('/token', (req, res) => res.json({ token: generateCsrfToken(req, res) }));
  app.post('/guarded', csrfProtect, (_req, res) => res.json({ ok: true }));
  return app;
}

describe('csrfProtect wrapper', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  test('test-mode bypass: POST succeeds without CSRF token when NODE_ENV=test', async () => {
    process.env.NODE_ENV = 'test';
    const res = await request(buildApp()).post('/guarded').send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('non-test mode: POST without CSRF token returns 403 JSON', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(buildApp()).post('/guarded').send({});
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/CSRF/i);
    expect(res.body.code).toBe(403);
  });

  test('non-test mode: POST with invalid CSRF token returns 403', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(buildApp())
      .post('/guarded')
      .set('x-csrf-token', 'obviously-fake')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid CSRF token');
  });

  test('non-test mode: POST with a valid CSRF token is accepted', async () => {
    process.env.NODE_ENV = 'production';
    const agent = request.agent(buildApp());
    const tokenRes = await agent.get('/token');
    expect(tokenRes.status).toBe(200);
    const { token } = tokenRes.body;

    const res = await agent
      .post('/guarded')
      .set('x-csrf-token', token)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
