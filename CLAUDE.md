# Eventify

Concert Management Information System (MIS) — 3-role web app (Manager, Admin/Event Organizer, Security Team) for real-time concert operations: ticket & finance reporting, vendor management, crowd/security monitoring, and an AI-assisted evaluation report.

Full planning docs live in `.planning/`:

- **[.planning/PROJECT.md](.planning/PROJECT.md)** — project overview, roles, constraints, success metrics
- **[.planning/research/STACK.md](.planning/research/STACK.md)** — technology stack actually in use, and why
- **[.planning/CONVENTIONS.md](.planning/CONVENTIONS.md)** — backend/frontend/database patterns to follow
- **[.planning/ARCHITECTURE.md](.planning/ARCHITECTURE.md)** — auth flow, single active-concert model, real-time layer, AI report pipeline

See [README.md](README.md) and [server/README.md](server/README.md) for setup instructions and the full API/database reference.

## Quick orientation

- **Frontend**: `src/` — React 18 + TypeScript + Vite, Zustand stores per domain, role-gated routing (`src/routes/`, `src/layouts/navConfig.ts`).
- **Backend**: `server/src/` — Express + PostgreSQL (no ORM), one route file per resource, JWT auth (`server/src/auth/jwt.js`), `resolveActiveEventId()` (`server/src/db/pool.js`) scopes almost every operational query to whichever concert is currently Live.
- **Docker**: `docker compose up --build` runs `db` (Postgres), `server` (migrates on boot), `web` (Vite build served via nginx) — see root `docker-compose.yml`.

Before making structural changes, skim `.planning/CONVENTIONS.md` and `.planning/ARCHITECTURE.md` first — several patterns here (role-scoped notifications, the single active-event resolver, manual-vs-simulated data split) are easy to accidentally reintroduce as bugs if you don't know they're deliberate.
