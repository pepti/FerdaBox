'use strict';

/**
 * Integration tests for server/services/tokenCleanup.js.
 * Inserts expired + active Lucia sessions and verifies the periodic
 * cleanup routine removes only the expired ones.
 */
const db = require('../../server/config/database');
const { cleanExpiredSessions, startTokenCleanup } = require('../../server/services/tokenCleanup');
const { createTestAdminUser, cleanTables } = require('../helpers');

beforeEach(async () => {
  await cleanTables();
});

afterAll(async () => {
  await db.pool.end();
});

describe('cleanExpiredSessions', () => {
  test('removes sessions whose expires_at is in the past', async () => {
    const userId = await createTestAdminUser();
    await db.query(
      `INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES ('expired-1', $1, NOW() - INTERVAL '1 day', '127.0.0.1', 'test')`,
      [userId]
    );

    await cleanExpiredSessions();

    const { rows } = await db.query(
      `SELECT id FROM user_sessions WHERE id = 'expired-1'`
    );
    expect(rows).toHaveLength(0);
  });

  test('leaves sessions that have not yet expired', async () => {
    const userId = await createTestAdminUser();
    await db.query(
      `INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES ('active-1', $1, NOW() + INTERVAL '1 day', '127.0.0.1', 'test')`,
      [userId]
    );

    await cleanExpiredSessions();

    const { rows } = await db.query(
      `SELECT id FROM user_sessions WHERE id = 'active-1'`
    );
    expect(rows).toHaveLength(1);
  });

  test('is a no-op (and does not throw) when no sessions exist', async () => {
    await expect(cleanExpiredSessions()).resolves.toBeUndefined();
  });

  test('swallows errors rather than throwing', async () => {
    // Force an error by temporarily monkey-patching db.query to reject.
    const orig = db.query;
    db.query = jest.fn().mockRejectedValueOnce(new Error('boom'));
    await expect(cleanExpiredSessions()).resolves.toBeUndefined();
    db.query = orig;
  });

  test('startTokenCleanup returns a Timer that can be cleared', async () => {
    // Runs cleanExpiredSessions once synchronously and schedules an interval.
    const timer = startTokenCleanup();
    expect(timer).toBeDefined();
    clearInterval(timer);
  });
});
