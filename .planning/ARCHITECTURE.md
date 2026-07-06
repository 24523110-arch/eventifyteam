# Architecture

## Request flow

```
Browser (React SPA, Zustand stores)
   │  fetch + Bearer JWT
   ▼
Express (server/src/index.js)
   │  requireAuth → requireRole/requireRoleForWrites
   ▼
Route handler (server/src/routes/*.js)
   │  resolveActiveEventId() when the operation is concert-scoped
   ▼
PostgreSQL (server/src/db/schema.sql)
```

## Auth & authorization

- Login (`POST /api/auth/login`) checks `app_users` via `pgcrypto`'s `crypt()` and issues an HS256 JWT (`server/src/auth/jwt.js`, `node:crypto`, no external dependency) carrying `{ sub, role, name }`.
- Every subsequent request carries the token as `Authorization: Bearer <token>`; `requireAuth` middleware verifies it and attaches `req.user`.
- Authorization is role-based and enforced **twice**: client-side (`RoleRoute` redirects, `NAV_BY_ROLE` hides menu items) for UX, and server-side (`requireRole` / `requireRoleForWrites` at the route-mount level in `index.js`) for actual security — the client-side guard alone would not stop a direct API call.
- The frontend persists `{ token, user }` to `localStorage` and rehydrates on load; a 401 response anywhere triggers `useAuthStore`'s logout, which the router picks up and redirects to `/login`.

## Single active-concert model

The `events` table holds many concerts (`Scheduled` / `Live` / `Ended`), not just one. `resolveActiveEventId()` (`server/src/db/pool.js`) is the single place that decides which concert every operational route (dashboard, vendors, incidents, notifications) reads and writes:

1. Whichever concert has `status = 'Live'` (there is only ever one — starting a new concert Live auto-ends any other).
2. Else, the most recently `Ended` concert (so data stays visible right after a concert wraps, instead of the dashboard going blank).
3. Else, the newest `Scheduled` concert.

Creating a new concert (`POST /api/events`, admin-only) provisions a **zeroed operational scaffold** — `finance_summary`, `ticket_summary`, `crowd_zones` (proportional to capacity), and the trend-bucket tables — via `server/src/services/events.js`, so the moment it goes Live there's real data for the dashboard to read instead of an empty state.

## Real-time layer

**Client polling** (`src/hooks/useRealtimePolling.ts`) refetches dashboard/notifications/incidents every 8s in "silent" mode (no loading flash, no error toast spam), plus on tab-focus. This is what propagates *human* changes (a new incident, an updated attendance count, a filed ticket report) to every open screen.

**There is no simulated sensor feed.** Crowd-zone occupancy is a static snapshot in the database — it only changes when someone changes it. `server/src/simulator.js` (random-walks zone density + auto-files incidents on critical zones, only while a concert is `Live`) is retained purely as an opt-in demo/stress tool: off unless `SIMULATOR_ENABLED=true`. It never touches ticket counts, finance totals, or attendance — those are manual MIS entries (see below).

## Manual reporting (the MIS half)

Three figures are entered by hand, by the role that owns that data in real life, rather than simulated:

| Data | Entered by | Endpoint | Notes |
|---|---|---|---|
| Ticket counts (sold, remaining) | Admin/Event Organizer | `PUT /api/ticket-sales` | Ticket revenue is derived server-side from `sold × avg price`; refunds are preserved read-only, not part of this input. |
| Finance totals (revenue, expenses) | Admin/Event Organizer | `PUT /api/finance` | Profit and margin are always recomputed server-side from these two figures. |
| Audience attendance | Security Team | `PUT /api/attendance` | Security physically counts people in at the gates — this is deliberately not an Admin figure. |

Both the ticket/finance report and the attendance figure live on the merged **Reports & Ticket Sales** page (Admin) and **Crowd Monitoring** page (Security) respectively — see `CONVENTIONS.md` for the input-form sync pattern that keeps these forms safe under background polling.

## AI evaluation report pipeline

```
Manager clicks "Generate Evaluation Report"
   │  POST /api/reports/evaluation  (bodyless)
   ▼
resolveActiveEventId()
   │
   ├─ finance_summary + ticket_summary  (Admin/EO's manual report)
   └─ getIncidentMetrics() + recent incidents  (Security's incident record)
   ▼
claudeClient.generateInsight(input)
   │  Claude API (claude-opus-4-8) if ANTHROPIC_API_KEY set
   └─ else insightGenerator.buildLocalInsight(input)  (deterministic fallback, same structure)
   ▼
pdfBuilder.buildReportPdf(input, insight, generatedAt)
   │
   ├─ persisted to `reports` table (pdf_base64)
   └─ returned to the client for immediate download
```

Report generation never hard-fails on the AI call — a missing key or a failed/timed-out request transparently falls back to the local template, which covers the same two aspects (ticket/finance, security) in the same narrative shape.

## Notifications

Notifications are role-scoped at read time, not filtered client-side: `notifications.target_role` pins a notification to one role (e.g. an incident alert → `security`), while `target_role IS NULL` + a category in that role's category set (`ROLE_CATEGORIES` in `routes/notifications.js`) covers "any role interested in this category sees it" — `system` category is in every role's set, which is how concert status-change announcements reach everyone.
