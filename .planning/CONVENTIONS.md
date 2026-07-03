# Conventions

Patterns established in this codebase — follow these when adding new features rather than introducing a new pattern.

## Backend

- **One route file per resource** under `server/src/routes/` (`vendors.js`, `incidents.js`, `events.js`, `finance.js`, `ticketSales.js`, `attendance.js`, …). Each exports an Express `Router`; mounting + role middleware happens once, centrally, in `server/src/index.js` — never inside the route file itself.
- **Service layer for reusable logic**, not for every route. `server/src/services/incidents.js` (incident creation + response-time metrics) and `server/src/services/events.js` (new-concert scaffold provisioning) exist because their logic is called from more than one place (a route *and* the simulator, or a route *and* report generation). Don't create a service file for logic used exactly once.
- **`resolveActiveEventId()`** (`server/src/db/pool.js`) is how every operational route finds "the concert to read/write" — never hardcode an event id. Priority: whichever concert is `Live`, else the most recently `Ended`, else the newest `Scheduled`.
- **Auth middleware composition**: `requireAuth` (valid JWT) → `requireRole(...)` (exact roles only) or `requireRoleForWrites(...)` (any authed role can `GET`, only the named role(s) can write). Apply at the `app.use()` mount point, not inside handlers.
- **Toast-friendly error responses**: every error path returns `{ error: "<Indonesian-language message>" }` with an appropriate HTTP status — the frontend's `api.ts` wrapper surfaces `error` directly in a toast, so write messages a user should actually read.
- **Notifications are role-scoped, not global**: use `createNotification({ category, priority, targetRole, ... })` from `server/src/notify.js`. `targetRole: null` + a category in a role's category set (see `ROLE_CATEGORIES` in `routes/notifications.js`) is how "everyone sees this" (e.g. `system` category) is expressed — don't add a separate broadcast mechanism.

## Frontend

- **One Zustand store per domain**, colocated in `src/store/`. A store owns its API calls (via `src/services/api.ts`), its own `isLoading`, and any optimistic-update rollback logic. Components read via selector functions (`useXStore((s) => s.field)`), not by destructuring the whole store, to avoid unnecessary re-renders.
- **Fetch-on-mount lives in the page/layout, not the store module**. Stores no longer self-fetch at import time (that would fire before auth is ready) — `AppLayout` fetches shared data once auth is confirmed; role-specific pages (`UserManagement`, `VendorManagement`, `ConcertSchedule`, …) fetch their own data in a `useEffect` on mount.
- **Silent background refresh**: real-time polling (`src/hooks/useRealtimePolling.ts`) calls store fetch actions with `{ silent: true }` so a background refresh never flashes a loading skeleton or spams an error toast — only the initial/manual fetch does that.
- **Manual-entry forms sync from the store, not the other way**: an input's local `useState` is synced from the store value in a `useEffect` keyed on that store value (not on every render) — this means a background poll never clobbers a draft the user is mid-typing, because the effect only re-fires when the *stored* value actually changes (i.e., after a save).
- **Glassmorphism via shared classes**: use the `.glass` / `.glass-panel` / `.input-glass` utility classes (`src/app/index.css`) and the `glass` Tailwind color token for any new translucent surface — never hardcode `bg-white/[0.0X]` directly, since that bypasses the dark/light theme system.
- **Bahasa Indonesia for user-facing strings**, English for code/identifiers/comments. Toasts, form labels, and validation messages are Indonesian; variable names, function names, and code comments are English.
- **Role-gated UI is enforced twice**: `NAV_BY_ROLE` (`src/layouts/navConfig.ts`) hides menu items, and `RoleRoute` (`src/routes/ProtectedRoute.tsx`) redirects if a role's URL is visited directly. Adding a new role-scoped page means updating both, plus the corresponding backend `requireRole`/`requireRoleForWrites` mount.

## Database

- Every new table takes an `event_id` foreign key to `events(id) ON DELETE CASCADE` unless it's genuinely event-independent (users, lookup tables). This is what makes `resolveActiveEventId()` scoping work everywhere.
- Schema changes are additive and idempotent: `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Never write a destructive migration (`DROP TABLE`, `DROP COLUMN`) against a table that may already hold real data without an explicit ask — if a feature is removed, stop creating the table for *new* installs and leave existing rows alone.
