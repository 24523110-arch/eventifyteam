# Technology Stack

The stack actually in use in this repository, and why each piece was chosen for a 3-role concert MIS.

## Frontend

| Technology | Purpose | Why |
|---|---|---|
| React 18 + TypeScript | UI framework | Three distinct role-based UIs (Manager / Admin-EO / Security) share components but need per-role routing and guards — a typed SPA keeps that safe. |
| Vite | Build tool | Fast HMR during development; simple `tsc -b && vite build` production build (verified inside the Docker image). |
| React Router v6 | Routing | Role-aware routing via a `RoleRoute` guard that redirects to the caller's own dashboard if they hit another role's URL directly. |
| Zustand | Client state | One store per domain (`authStore`, `dashboardStore`, `vendorStore`, `incidentStore`, `eventStore`, `notificationStore`, `themeStore`, …) — no Redux boilerplate; each store owns its own API calls via `src/services/api.ts`. |
| TailwindCSS + Radix UI (shadcn-style) | UI components | Copy-owned Dialog/Select/Input primitives (`src/components/ui/`) give Radix accessibility without a component-library dependency. |
| Framer Motion | Animation | Page/list transitions, live-status pulse indicators. |
| Recharts | Charts | Revenue/ticket/crowd-density trend charts across dashboards. |

### Theming

Dark (default) and light themes are driven entirely by CSS custom properties (`src/app/index.css`) — `surface.*`, `ink.*`, and a `glass` token (replacing literal Tailwind `white/[opacity]` usage) resolve through `rgb(var(--x) / <alpha-value>)`. `src/store/themeStore.ts` toggles a single `.light` class on `<html>` and persists the choice to `localStorage` — no per-component dark/light class pairs needed.

## Backend

| Technology | Purpose | Why |
|---|---|---|
| Node.js + Express | API server | Small, well-understood route-per-resource structure (`server/src/routes/*.js`) — the module count (auth, users, vendors, incidents, dashboard, notifications, reports, events, finance, ticketSales, attendance, reference) is deliberately kept flat rather than framework-scaffolded. |
| PostgreSQL (`pg`, no ORM) | Database | Relational model fits the domain hard: an incident belongs to an event, a vendor belongs to an event, a report is generated from an event's finance+ticket+incident data. Raw SQL in route/service files keeps queries auditable; no ORM migration DSL to learn. |
| `pgcrypto` | Password hashing | `crypt()` / `gen_salt('bf')` inside Postgres — no native bcrypt Node binary to compile. Ships by default on Docker's official `postgres` image. |
| Hand-rolled JWT (`node:crypto`) | Auth tokens | HS256 sign/verify in ~40 lines (`server/src/auth/jwt.js`) — no external JWT dependency needed for a single-secret, single-audience token. |
| `pdfkit` | PDF generation | Builds the AI evaluation report PDF section-by-section (finance, security summary, AI narrative). |
| Anthropic Claude API (`claude-opus-4-8`) | AI narrative | Generates the concert evaluation narrative from server-assembled ticket/finance/incident data; falls back to a deterministic local template (`insightGenerator.js`) if no `ANTHROPIC_API_KEY` is set or the call fails — report generation never hard-fails. |
| `dotenv`, `cors` | Config/CORS | Standard Express middleware. |

## Infrastructure

| Technology | Purpose |
|---|---|
| Docker Compose | `db` (postgres:16), `server` (Express, runs migrations on boot), `web` (Vite build served via nginx with SPA fallback) |
| nginx | Static asset serving + `try_files ... /index.html` for client-side routing |

## What NOT to use here (and why)

| Avoid | Why |
|---|---|
| An ORM (Prisma/Drizzle/TypeORM) | The route surface is small enough (a dozen resources) that raw parameterized SQL stays readable; adding an ORM would be a migration-tooling cost with no query the app actually needs help writing. |
| Redux / any global-state library beyond Zustand | No cross-cutting state that Zustand's per-domain stores don't already cover. |
| A job queue (BullMQ, etc.) | The only "background" work is the live crowd-density simulator (`server/src/simulator.js`), an in-process `setInterval` — single-server deployment, no retry/reliability requirement. |
| Payment processing SDKs | Explicitly out of scope — ticket revenue/expenses are manually reported figures, not processed transactions. |
