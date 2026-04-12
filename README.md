# FerdaBox

Travel box e-commerce site for car roof boxes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4.18 |
| Database | PostgreSQL 16 |
| Frontend | Vanilla JS SPA (MVC + Component pattern) |
| Auth | Lucia v3 (session-based) |
| Deployment | Azure App Service (Docker) |

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16+

---

## Local Setup

**1. Clone and install dependencies**

```bash
git clone https://github.com/Halli/FerdaBox.git
cd FerdaBox
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in all values. See `.env.example` for documentation.

**3. Create the database and run migrations**

```bash
createdb ferdabox        # or create via psql
npm run migrate
```

**4. (Optional) Seed sample data**

```bash
npm run seed
```

**5. Start the development server**

```bash
npm run dev       # nodemon — auto-restarts on changes
# or
npm start         # plain node
```

The app is served at `http://localhost:3000`.

---

## Running Tests

```bash
npm test           # run all tests
npm run test:ci    # CI mode (--runInBand --forceExit)
npm run test:e2e   # Playwright E2E tests
```

Tests require a running PostgreSQL instance. Configure `DATABASE_URL` in `.env` before running.

---

## Environment Variables

All variables are documented in `.env.example`. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `CSRF_SECRET` | 32+ char hex secret for CSRF signing |
| `DB_SSL` | Set `true` for hosted PostgreSQL |
| `APP_URL` | Public URL for email links |

---

## Deployment

FerdaBox deploys to Azure App Service via Docker containers.

1. Push to `master` triggers CI (lint + tests + E2E).
2. On CI success, the deploy workflow builds and pushes a Docker image to Azure Container Registry.
3. Azure App Service pulls the new image and restarts.

Required GitHub Secrets: `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_CREDENTIALS`.

---

## License

[MIT](LICENSE)
