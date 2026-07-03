# Eventify Server

Express + PostgreSQL backend for Eventify. Serves every domain module (auth, users, vendors, incidents, dashboard, notifications) and the AI Concert Evaluation Report feature.

## What it does

- `POST /api/auth/login` — validates credentials against `app_users` (bcrypt via PostgreSQL's `pgcrypto`) and returns `{ user, token }`, where `token` is an HS256 JWT (8h expiry, signed with `JWT_SECRET`).
- **Auth**: every route below requires an `Authorization: Bearer <token>` header (401 otherwise). Reads (`GET`) are allowed for any signed-in user so each role's dashboard can aggregate cross-module data; writes are scoped to the owning role — `users` → manager, `vendors` → admin, `incidents` → security, `reports/evaluation` → manager, `events` (reads too) → admin, `finance`/`ticket-sales` → admin, `attendance` → security (403 otherwise). Public routes: `POST /api/auth/login`, `GET /api/reference`, `GET /api/health`.
- **Manual reporting, not simulation**: `PUT /api/finance` `{ revenue, expenses }` and `PUT /api/ticket-sales` `{ sold, remaining }` (admin only, both surfaced on the merged **Reports & Ticket Sales** page) let the Event Organizer file finance and ticket figures by hand for the active concert — profit/margin and ticket revenue are always recomputed server-side, never entered directly, and there's no refund field (the stored `refunds` value is left untouched by this endpoint). `PUT /api/attendance` `{ attendance }` (security only) is the Security Team's own headcount entry. The live simulator (`src/simulator.js`) no longer touches any of these three — it only random-walks crowd-zone density (Live/Crowd Monitoring) and files/advances incidents on a critical zone.
- **Active concert**: almost every route below operates on whichever concert `resolveActiveEventId()` (`src/db/pool.js`) resolves to — the one that's `Live`, else the most recently `Ended`, else the newest `Scheduled`. Switching which concert is Live (via the Concert Schedule) instantly redirects every dashboard, vendor list, incident list, notification feed, and the live simulator to that concert's own data.
- `GET/POST/PUT/DELETE /api/users`, `/api/vendors`, `/api/incidents` — CRUD for User Management, Vendor Management, and Incident Center (scoped to the active concert).
- `PATCH /api/incidents/:id/status`, `/api/incidents/:id/assign` — incident workflow actions. Status transitions stamp `acknowledged_at` (first move off `new`) and `resolved_at` for response-time metrics.
- `GET /api/incidents/metrics` — response/resolution-time aggregates (avg response min, % within the 8-min target, avg resolution min, counts by severity). Reused server-side by report generation.
- **`GET/POST/PUT/DELETE /api/events`, `PATCH /api/events/:id/status`** (admin only, including reads) — the Concert Schedule: many concerts tracked as `Scheduled`/`Live`/`Ended`. `POST` provisions a zeroed operational scaffold (finance, ticketing, crowd zones, trend buckets) for the new concert. `PATCH .../status` to `Live` auto-ends any other Live concert (only one runs at a time) and starts the simulator moving its data; `DELETE` is blocked while a concert is `Live`.
- Bell notifications are **role-scoped**: `GET/PATCH/DELETE /api/notifications` filters by the caller's role (`target_role`, or the category→role mapping) — Security sees security alerts, Admin sees vendor/ticket, Manager sees finance/report/system; untargeted `system` notifications (e.g. concert status changes) reach every role.
- `GET /api/dashboard` — aggregate read (concert info, finance, tickets, crowd zones, trends) backing every role's dashboard, scoped to the active concert.
- `POST /api/reports/evaluation` — bodyless; the server assembles the Admin/EO's ticket & finance report + the Security Team's incident summary for the active concert, generates a narrative insight covering both (Claude API if `ANTHROPIC_API_KEY` is set, else a deterministic local summary with the same structure), builds a PDF via `pdfkit` with a section per source, and persists it to the `reports` table.
- `GET /api/reference` — lookup data for the frontend forms (`roles`, `securityTeams`, `vendorCategories`), so no dropdown options are hardcoded client-side.

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
- `src/db/seed.sql` — seeds the demo concert (`evt-001`, 6 users, 8 vendors, 5 incidents, 6 crowd zones, notifications, finance/ticketing figures). Idempotent — skips if `evt-001` already exists. Additional concerts created afterward via `POST /api/events` get the same scaffold shape (zeroed) via `src/services/events.js`.
- `src/db/pool.js` — `pg` connection pool, reads `DATABASE_URL`.
- `src/db/migrate.js` — runs schema then seed. Re-run any time; both files are safe to apply twice.

Demo login passwords (same as before): `manager@eventify.io / manager123`, `admin@eventify.io / admin123`, `security@eventify.io / security123`. The three extra directory-only users (Maya, Fajar, Budi) get a placeholder password `changeme123`.

Password hashing uses PostgreSQL's `pgcrypto` extension (`crypt()` / `gen_salt('bf')`) so there's no native bcrypt Node dependency to compile. `pgcrypto` ships by default on Docker's official `postgres` image, Homebrew Postgres, RDS, Supabase, Neon, and Railway.

## Notes

- If `ANTHROPIC_API_KEY` is missing or the API call fails for any reason, the server transparently falls back to a local logic-based summary — report generation never hard-fails because of the AI call.
- `GET /api/health` also pings the database and reports `degraded` if PostgreSQL is unreachable.
