'use strict';

/**
 * Integration tests for /api/v1/cart — exercises both the cart controller
 * and the Cart model via supertest.
 */
const request = require('supertest');
const app     = require('../../server/app');
const db      = require('../../server/config/database');
const {
  getTestSessionCookie,
  cleanTables,
  validProject,
} = require('../helpers');

let sessionCookie;
let productId;

beforeEach(async () => {
  await cleanTables();
  sessionCookie = await getTestSessionCookie(); // admin session

  // Create a product so we can add it to the cart.
  const res = await request(app)
    .post('/api/v1/projects')
    .set('Cookie', sessionCookie)
    .send(validProject({ price: 9900, stock_quantity: 10, status: 'active' }));
  productId = res.body.id;
});

afterAll(async () => {
  await db.pool.end();
});

describe('GET /api/v1/cart', () => {
  test('unauthenticated gets 401', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  test('returns empty cart for a fresh user', async () => {
    const res = await request(app).get('/api/v1/cart').set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], count: 0, total: 0 });
  });
});

describe('POST /api/v1/cart', () => {
  test('adds an item and returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.project_id).toBe(productId);
    expect(res.body.quantity).toBe(2);
  });

  test('defaults quantity to 1 when omitted', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId });
    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(1);
  });

  test('adding the same product twice increments the quantity (upsert)', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 2 });
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 3 });
    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(5);
  });

  test('missing project_id returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project_id/);
  });

  test('non-integer quantity returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 'two' });
    expect(res.status).toBe(400);
  });

  test('zero quantity returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 0 });
    expect(res.status).toBe(400);
  });

  test('unauthenticated returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .send({ project_id: productId, quantity: 1 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/cart (with items)', () => {
  test('returns item list with count and total', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 3 });

    const res = await request(app).get('/api/v1/cart').set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.count).toBe(3);
    expect(res.body.total).toBe(9900 * 3);
  });
});

describe('GET /api/v1/cart/count', () => {
  test('returns zero for empty cart', async () => {
    const res = await request(app).get('/api/v1/cart/count').set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  test('returns summed quantity', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 4 });
    const res = await request(app).get('/api/v1/cart/count').set('Cookie', sessionCookie);
    expect(res.body.count).toBe(4);
  });
});

describe('PATCH /api/v1/cart/:itemId', () => {
  test('updates the quantity of an existing item', async () => {
    const add = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 1 });
    const itemId = add.body.id;

    const res = await request(app)
      .patch(`/api/v1/cart/${itemId}`)
      .set('Cookie', sessionCookie)
      .send({ quantity: 7 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(7);
  });

  test('returns 404 for a non-existent item', async () => {
    const res = await request(app)
      .patch('/api/v1/cart/999999')
      .set('Cookie', sessionCookie)
      .send({ quantity: 2 });
    expect(res.status).toBe(404);
  });

  test('invalid quantity returns 400', async () => {
    const add = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 1 });
    const itemId = add.body.id;

    const res = await request(app)
      .patch(`/api/v1/cart/${itemId}`)
      .set('Cookie', sessionCookie)
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/cart/:itemId', () => {
  test('removes an item and returns 204', async () => {
    const add = await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 1 });
    const itemId = add.body.id;

    const res = await request(app)
      .delete(`/api/v1/cart/${itemId}`)
      .set('Cookie', sessionCookie);
    expect(res.status).toBe(204);

    const after = await request(app).get('/api/v1/cart').set('Cookie', sessionCookie);
    expect(after.body.items).toHaveLength(0);
  });

  test('returns 404 for a non-existent item', async () => {
    const res = await request(app)
      .delete('/api/v1/cart/999999')
      .set('Cookie', sessionCookie);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/cart', () => {
  test('clears all items and returns 204', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Cookie', sessionCookie)
      .send({ project_id: productId, quantity: 2 });

    const res = await request(app).delete('/api/v1/cart').set('Cookie', sessionCookie);
    expect(res.status).toBe(204);

    const after = await request(app).get('/api/v1/cart').set('Cookie', sessionCookie);
    expect(after.body.items).toHaveLength(0);
  });
});
