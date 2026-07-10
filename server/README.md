# Eventify Server

Express + PostgreSQL backend for Eventify. Serves every domain module (auth, users, vendors, incidents, dashboard, notifications) and the AI Concert Evaluation Report feature.

## What it does

- `POST /api/auth/login` — validates credentials against `app_users` (bcrypt via PostgreSQL's `pgcrypto`) and returns `{ user, token }`, where `token` is an HS256 JWT (8h expiry, signed with `JWT_SECRET`).
- **Auth**: every route below requires an `Authorization: Bearer <token>` header (401 otherwise). Reads (`GET`) are allowed for any signed-in user so each role's dashboard can aggregate cross-module data; writes are scoped to the owning role — `users` → manager, `vendors` → admin, `incidents` → security, `reports/evaluation` → manager, `events` (reads too) → admin, `finance`/`ticket-sales` → admin, `attendance` → security (403 otherwise). Public routes: `POST /api/auth/login`, `GET /api/reference`, `GET /api/health`.
- **Manual reporting, not simulation**: `PUT /api/finance` `{ revenue, expenses }` and `PUT /api/ticket-sales` `{ sold, remaining }` (admin only, both surfaced on the merged **Reports & Ticket Sales** page) let the Event Organizer file finance and ticket figures by hand for the active concert — profit/margin and ticket revenue are always recomputed server-side, never entered directly, and there's no refund field (the stored `refunds` value is left untouched by this endpoint). `PUT /api/attendance` `{ attendance }` (security only) is the Security Team's own headcount entry. **Crowd-zone occupancy is a static snapshot** — there is no live sensor feed; `src/simulator.js` (random-walk + auto incidents) is an opt-in demo tool, off unless `SIMULATOR_ENABLED=true`.
- **Active concert**: almost every route below operates on whichever concert `resolveActiveEventId()` (`src/db/pool.js`) resolves to — the one that's `Live`, else the most recently `Ended`, else the newest `Scheduled`. Switching which concert is Live (via the Concert Schedule) instantly redirects every dashboard, vendor list, incident list, and notification feed to that concert's own data.
- `GET/POST/PUT/DELETE /api/users`, `/api/vendors`, `/api/incidents` — CRUD for User Management, Vendor Management, and Incident Center (scoped to the active concert).
- `PATCH /api/incidents/:id/status`, `/api/incidents/:id/assign` — incident workflow actions. Status transitions stamp `acknowledged_at` (first move off `new`) and `resolved_at` for response-time metrics.
- `GET /api/incidents/metrics` — response/resolution-time aggregates (avg response min, % within the 8-min target, avg resolution min, counts by severity). Reused server-side by report generation.
- **`GET/POST/PUT/DELETE /api/events`, `PATCH /api/events/:id/status`** (admin only, including reads) — the Concert Schedule: many concerts tracked as `Scheduled`/`Live`/`Ended`. `POST` provisions a zeroed operational scaffold (finance, ticketing, crowd zones, trend buckets) for the new concert. `PATCH .../status` to `Live` auto-ends any other Live concert (only one runs at a time); `DELETE` is blocked while a concert is `Live`.
- Bell notifications are **role-scoped**: `GET/PATCH/DELETE /api/notifications` filters by the caller's role (`target_role`, or the category→role mapping) — Security sees security alerts, Admin sees vendor/ticket, Manager sees finance/report/system; untargeted `system` notifications (e.g. concert status changes) reach every role.
- `GET /api/dashboard` — aggregate read (concert info, finance, tickets, crowd zones, trends) backing every role's dashboard, scoped to the active concert.
- `POST /api/reports/evaluation` — bodyless; the server assembles the Admin/EO's ticket & finance report + the Security Team's incident summary for the active concert, generates a narrative insight covering both (Claude API if `ANTHROPIC_API_KEY` is set, else a deterministic local summary with the same structure), builds a PDF via `pdfkit` with a section per source, and persists it to the `reports` table.
- `POST/GET /api/lpj`, `PUT /api/lpj/:id/sections/:key`, `POST /api/lpj/:id/{submit,generate,approve}`, `POST /api/lpj/:id/sections/:key/return`, `PUT /api/lpj/:id/narrative`, `GET /api/lpj/:id/export/{pdf,docx}` — collaborative LPJ (accountability report). Section ownership is data-driven (`src/lpj/registry.js`): admin owns 11 sections, security owns 3, manager reviews/returns/generates the AI narrative (`src/lpj/narrative.js`, Claude with local fallback), approves with a digital signature, and exports via `src/lpj/pdf.js` / `src/lpj/docx.js`. Section data lives as JSONB in `lpj_sections`.
- `GET /api/reference` — lookup data for the frontend forms (`roles`, `securityTeams`, `vendorCategories`), so no dropdown options are hardcoded client-side.

## Setup

```bash
cd server
npm install
cp .env.example .env
# set DATABASE_URL to your PostgreSQL connection string
npm run db:migrate   # creates tables (schema.sql) and loads reference data (seed.sql)
npm run dev
```

Server runs on `http://localhost:4000` by default. The frontend's stores expect this URL — set `VITE_API_BASE_URL` in the frontend's `.env` if you run the backend elsewhere.

### First login (no demo accounts)

`seed.sql` only loads fixed lookup data (role labels, security team names, vendor categories) — there is no demo concert, vendor, incident, or user account. Since there's no self-registration screen (only a Manager can create accounts, from User Management), you have to insert the very first Manager account directly:

```bash
psql "$DATABASE_URL" -c "
INSERT INTO app_users (id, name, email, password_hash, role, avatar_initials, status)
VALUES ('u-001', 'Your Name', 'you@example.com', crypt('choose-a-strong-password', gen_salt('bf')), 'manager', 'YN', 'active');
"
```

Log in with that account, then use **User Management → Create User** to add the Admin/Event Organizer and Security Team accounts (and any other Managers) — passwords are set at creation time and work immediately for login.

## Database

- `src/db/schema.sql` — full DDL (enums, tables, indexes, foreign keys). Idempotent, uses `IF NOT EXISTS`.
- `src/db/seed.sql` — reference/lookup data only (`role_options`, `security_teams`, `vendor_categories`); no sample concerts, users, vendors, or incidents. Idempotent — safe to re-run. Concerts created via `POST /api/events` get a zeroed operational scaffold (finance, ticketing, crowd zones, trend buckets) via `src/services/events.js`.
- `src/db/pool.js` — `pg` connection pool, reads `DATABASE_URL`.
- `src/db/migrate.js` — runs schema then seed. Re-run any time; both files are safe to apply twice.

Password hashing uses PostgreSQL's `pgcrypto` extension (`crypt()` / `gen_salt('bf')`) so there's no native bcrypt Node dependency to compile. `pgcrypto` ships by default on Docker's official `postgres` image, Homebrew Postgres, RDS, Supabase, Neon, and Railway.

## Notes

- If `ANTHROPIC_API_KEY` is missing or the API call fails for any reason, the server transparently falls back to a local logic-based summary — report generation never hard-fails because of the AI call.
- `GET /api/health` also pings the database and reports `degraded` if PostgreSQL is unreachable.
