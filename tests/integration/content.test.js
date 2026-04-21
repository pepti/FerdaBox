'use strict';

/**
 * Integration tests for /api/v1/content/:key — site content CRUD.
 * The `site_content` table stores JSONB blobs keyed by a string identifier;
 * this suite exercises public reads plus admin/moderator writes.
 */
const request = require('supertest');
const path    = require('path');
const fs      = require('fs');
const app     = require('../../server/app');
const db      = require('../../server/config/database');
const {
  getTestSessionCookie,
  createTestRegularUser,
  cleanTables,
} = require('../helpers');

let adminCookie;

beforeEach(async () => {
  // cleanTables doesn't touch site_content (not in its list), so clear it manually.
  await cleanTables();
  await db.query('DELETE FROM site_content');
  adminCookie = await getTestSessionCookie();
});

afterAll(async () => {
  await db.pool.end();
});

describe('GET /api/v1/content/:key', () => {
  test('returns 404 when the key does not exist', async () => {
    const res = await request(app).get('/api/v1/content/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('returns the stored value for an existing key', async () => {
    // site_content.value is stored as TEXT (the schema declares JSONB but
    // the prod+test DBs have TEXT — the app parses client-side), so the
    // response body is the JSON-encoded string.
    await db.query(
      `INSERT INTO site_content (key, value) VALUES ($1, $2)`,
      ['hero_copy', JSON.stringify({ heading: 'Hello', body: 'World' })]
    );
    const res = await request(app).get('/api/v1/content/hero_copy');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ heading: 'Hello', body: 'World' });
  });

  test('is public — no authentication required', async () => {
    await db.query(
      `INSERT INTO site_content (key, value) VALUES ($1, $2)`,
      ['contact_info', JSON.stringify({ email: 'x@y.z' })]
    );
    const res = await request(app).get('/api/v1/content/contact_info');
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/v1/content/:key', () => {
  test('admin can create a new key', async () => {
    const res = await request(app)
      .put('/api/v1/content/about_page')
      .set('Cookie', adminCookie)
      .send({ headline: 'New', paragraph: 'Copy' });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ headline: 'New', paragraph: 'Copy' });

    const { rows } = await db.query(
      `SELECT value FROM site_content WHERE key = 'about_page'`
    );
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0].value)).toEqual({ headline: 'New', paragraph: 'Copy' });
  });

  test('admin can overwrite an existing key (upsert)', async () => {
    await db.query(
      `INSERT INTO site_content (key, value) VALUES ($1, $2)`,
      ['about_page', JSON.stringify({ headline: 'Old' })]
    );

    const res = await request(app)
      .put('/api/v1/content/about_page')
      .set('Cookie', adminCookie)
      .send({ headline: 'New', extra: true });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ headline: 'New', extra: true });
  });

  test('unauthenticated returns 401', async () => {
    const res = await request(app)
      .put('/api/v1/content/about_page')
      .send({ headline: 'Nope' });
    expect(res.status).toBe(401);
  });

  test('regular user gets 403', async () => {
    const userId = await createTestRegularUser();
    const userCookie = await getTestSessionCookie(userId);

    const res = await request(app)
      .put('/api/v1/content/about_page')
      .set('Cookie', userCookie)
      .send({ headline: 'Nope' });
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/content/:key/image', () => {
  const uploadDir = path.join(__dirname, '..', '..', 'public', 'assets', 'content');

  afterEach(() => {
    // Clean any files created during these tests so repeated runs stay clean.
    if (fs.existsSync(uploadDir)) {
      for (const f of fs.readdirSync(uploadDir)) {
        if (f.startsWith('testkey-')) {
          fs.unlinkSync(path.join(uploadDir, f));
        }
      }
    }
  });

  test('admin can upload a PNG image', async () => {
    // 1x1 red PNG
    const pngBuf = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c636060606000000000050001a5f6c5630000000049454e44ae426082',
      'hex'
    );
    const res = await request(app)
      .post('/api/v1/content/testkey/image')
      .set('Cookie', adminCookie)
      .attach('file', pngBuf, 'test.png');
    expect(res.status).toBe(200);
    expect(res.body.image_url).toMatch(/\/assets\/content\/testkey-\d+\.png$/);
  });

  test('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/v1/content/testkey/image')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns 400 for an unsupported MIME type', async () => {
    const res = await request(app)
      .post('/api/v1/content/testkey/image')
      .set('Cookie', adminCookie)
      .attach('file', Buffer.from('not an image'), { filename: 'x.exe', contentType: 'application/x-msdownload' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported/i);
  });

  test('unauthenticated returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/content/testkey/image');
    expect(res.status).toBe(401);
  });
});
