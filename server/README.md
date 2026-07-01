# Eventify Server

Express + PostgreSQL backend for Eventify. Serves every domain module (auth, users, vendors, incidents, dashboard, notifications) and the AI Concert Evaluation Report feature.

## What it does

- `POST /api/auth/login` — validates credentials against `app_users` (bcrypt via PostgreSQL's `pgcrypto`).
- `GET/POST/PUT/DELETE /api/users`, `/api/vendors`, `/api/incidents` — CRUD for User Management, Vendor Management, and Incident Center.
- `PATCH /api/incidents/:id/status`, `/api/incidents/:id/assign` — incident workflow actions.
- `GET /api/dashboard` — aggregate read (concert info, finance, tickets, crowd zones, trends) backing every role's dashboard.
- `GET/PATCH/DELETE /api/notifications` — bell panel data and read/clear actions.
- `POST /api/reports/evaluation` — generates a narrative insight (Claude API if `ANTHROPIC_API_KEY` is set, else a deterministic local summary) and a PDF via `pdfkit`, and persists it to the `reports` table.

## Setup

```bash
cd server
npm install
cp .env.example .env
# set DATABASE_URL to your PostgreSQL connection string
npm run db:migrate   # creates tables (schema.sql) and loads seed data (seed.sql)
npm run dev
```

Server runs on `http://localhost:4000` by default. The frontend's stores expect this URL — set `VITE_API_BASE_URL` in the frontend's `.env` if you run the backend elsewhere.

## Database

- `src/db/schema.sql` — full DDL (enums, tables, indexes, foreign keys). Idempotent, uses `IF NOT EXISTS`.
- `src/db/seed.sql` — seeds the same data the app used to ship as dummy data (one event, 6 users, 8 vendors, 5 incidents, 6 crowd zones, notifications, finance/ticketing figures). Idempotent — skips if `evt-001` already exists.
- `src/db/pool.js` — `pg` connection pool, reads `DATABASE_URL`.
- `src/db/migrate.js` — runs schema then seed. Re-run any time; both files are safe to apply twice.

Demo login passwords (same as before): `manager@eventify.io / manager123`, `admin@eventify.io / admin123`, `security@eventify.io / security123`. The three extra directory-only users (Maya, Fajar, Budi) get a placeholder password `changeme123`.

Password hashing uses PostgreSQL's `pgcrypto` extension (`crypt()` / `gen_salt('bf')`) so there's no native bcrypt Node dependency to compile. `pgcrypto` ships by default on Docker's official `postgres` image, Homebrew Postgres, RDS, Supabase, Neon, and Railway.

## Notes

- If `ANTHROPIC_API_KEY` is missing or the API call fails for any reason, the server transparently falls back to a local logic-based summary — report generation never hard-fails because of the AI call.
- `GET /api/health` also pings the database and reports `degraded` if PostgreSQL is unreachable.
