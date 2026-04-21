require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// ── Sentry error tracking — init before anything else if DSN is configured ────
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

// ── Required env var validation — fail fast on misconfiguration ────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'ALLOWED_ORIGINS'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[server] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const logger = require('./logger');
const app    = require('./app');
const { pool } = require('./config/database');
const { migrate } = require('./scripts/migrate');
const { startTokenCleanup } = require('./services/tokenCleanup');

const PORT = process.env.PORT || 3000;

// ── Global error handlers — catch unhandled rejections and exceptions ──────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, '[server] Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, '[server] Uncaught exception — shutting down');
  process.exit(1);
});

async function start() {
  // Run pending database migrations before accepting traffic
  await migrate();

  // First-boot seed: populate sample data if core tables are empty.
  // Safe to leave enabled — each check is a no-op once data exists.
  try {
    const { rows: p } = await pool.query('SELECT COUNT(*)::int AS n FROM projects');
    if (p[0].n === 0) {
      const { seedProjects } = require('./scripts/seed');
      await seedProjects();
    }
    const { rows: n } = await pool.query('SELECT COUNT(*)::int AS n FROM news_articles');
    if (n[0].n === 0) {
      const { seedNews } = require('./scripts/seed-news');
      await seedNews();
    }
  } catch (err) {
    logger.warn({ err: err.message }, '[server] First-boot seed skipped');
  }

  // Old gallery seeds removed — FerdaBox uses product seeds from seed.js only.

  // Admin sync: upsert the admin user declared by env vars on every boot.
  // Required env: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD. The env vars are
  // the source of truth — changing them and restarting will update the stored
  // hash. Skipped entirely if any of the three are unset.
  try {
    const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (ADMIN_USERNAME && ADMIN_EMAIL && ADMIN_PASSWORD) {
      const { Scrypt } = require('oslo/password');
      const hash = await new Scrypt().hash(ADMIN_PASSWORD);
      await pool.query(
        `INSERT INTO users (email, username, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (username) DO UPDATE
           SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = 'admin'`,
        [ADMIN_EMAIL, ADMIN_USERNAME, hash]
      );
      logger.info({ username: ADMIN_USERNAME }, '[server] Admin user synced from env');
    }
  } catch (err) {
    logger.warn({ err: err.message }, '[server] Admin sync skipped');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT, host: '0.0.0.0' }, 'FerdaBox server started');
  });

  // Start periodic cleanup of expired sessions (runs every 24h)
  const cleanupTimer = startTokenCleanup();

  // Graceful shutdown — finish in-flight requests before exiting
  function shutdown(signal) {
    logger.info({ signal }, '[server] Shutting down gracefully');
    server.close(async () => {
      clearInterval(cleanupTimer);
      logger.info('[server] HTTP server closed');
      await pool.end();
      logger.info('[server] Database pool closed');
      process.exit(0);
    });

    // Force exit if still open after 10 seconds
    setTimeout(() => {
      logger.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch(err => {
  logger.error({ err }, '[server] Startup failed');
  process.exit(1);
});
