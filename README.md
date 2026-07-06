# Eventify — Concert Management System (Revised)

Dark neon purple, glassmorphism concert MIS — revised down to 3 roles with fully functional CRUD, a scrollable splash/login page, and an AI-assisted PDF evaluation report. Built with React 18, TypeScript, Vite, TailwindCSS, Radix UI (shadcn-style components), Framer Motion, Recharts, and Zustand. Backend is Express + PostgreSQL, plus `pdfkit` for report generation.

## Roles & access

| Role | Pages |
|---|---|
| **Manager** | Dashboard, Finance, Reports (AI evaluation report), User Management |
| **Admin / Event Organizer** | Dashboard, **Concert Schedule** (multi-event CRUD + Mulai Live/Akhiri Konser), Vendor Management, **Reports & Ticket Sales** (manual ticket + finance report) |
| **Security Team** | Dashboard, Live Monitoring, **Crowd Monitoring (manual attendance input)**, Incident Center (track/assign/resolve incidents) |

**Manual reporting (MIS, not simulated):** the Admin/Event Organizer's **Reports & Ticket Sales** page is a single merged feature — one form reports **Tiket Terjual**, **Tiket Tersisa**, **Total Pendapatan**, and **Total Pengeluaran** (no refund input; profit, margin, and ticket revenue are always server-computed from those four figures). That report is what feeds the Manager's AI evaluation — there's no separate "field report" step. Audience attendance is **not** an Admin figure — the Security Team enters it on Crowd Monitoring (they're the ones physically counting people in at the gates), alongside their existing incident tracking/assign/resolve workflow. **Crowd-zone occupancy is a static snapshot in the database, not a live sensor feed** — nothing in the app changes unless a person changes it. (An optional random-walk simulator still exists for demos/stress tests but is off by default; enable with `SIMULATOR_ENABLED=true`.)

**Reporting flow → AI:** when the Manager clicks **Generate Evaluation Report**, the backend assembles the Admin/EO's ticket & finance report + the Security Team's incident record (counts by severity, resolution status, avg response time) for the active concert, and hands it all to Claude for one detailed narrative evaluation — the PDF includes a section per source.

**Concert schedule:** the Admin/Event Organizer manages many concerts — Scheduled (belum berlangsung), Live (sedang berlangsung), or Ended (riwayat, editable/deletable). Only one concert is Live at a time; starting a new one automatically ends whichever was previously Live. Every operational module (dashboards, vendors, incidents, notifications) automatically follows whichever concert is Live.

**Notifications are role-specific**: Security sees incident/security alerts, Admin sees vendor/ticket updates, Manager sees finance/report/system — plus untargeted `system` announcements (like concert status changes) reach everyone.

**Dark/light theme**: a single toggle button in the Navbar (next to the notification bell) switches the whole app between the default dark neon-purple theme and a light theme — one click, persisted across sessions. There's no separate Settings page for any role; it's been removed.

Menus are hidden (not disabled) per role in the sidebar, and routes are guarded client-side via `RoleRoute` — visiting another role's URL directly redirects to your own dashboard. Access is **also enforced server-side**: login issues a JWT, every API request carries it as a Bearer token, and writes are restricted to the owning role (a security user cannot `POST /api/users`, etc.). The session persists across refreshes and is cleared on 401.

**No demo accounts** — the database starts empty (only role/lookup reference data is seeded). There's no self-registration screen, so the very first Manager account has to be inserted directly into `app_users` (see [server/README.md](server/README.md#first-login-no-demo-accounts)); every other account is then created through **User Management → Create User**, with a real password set at creation time.

## What's functional

- **Splash + Login**: scrollable landing hero above a real login form — email format validation, password length validation, role selector, remember me, loading state, inline + banner error messages, redirect to the correct dashboard per role. Auth is checked against PostgreSQL (`POST /api/auth/login`, bcrypt via `pgcrypto`).
- **CRUD (Shadcn-style Dialog + Select, all wired to Zustand stores → REST API → PostgreSQL)**:
  - User Management (Manager) — create (with a real password the new user logs in with immediately), edit, enable/disable, delete, search
  - Vendor Management (Admin) — create, edit, delete, search, status filter
  - Incident Center (Security) — create, edit, delete, search, status actions (Escalate/Resolve/Close) in a detail dialog
- **Notifications**: bell panel opens, mark-as-read, mark-all-as-read, clear all — all persisted.
- **AI Concert Evaluation Report (Manager → Reports)**: one click triggers the backend, which assembles the Admin/EO's ticket & finance report and the Security Team's incident summary for the active concert, generates a narrative insight (Claude API if `ANTHROPIC_API_KEY` is set server-side, else a deterministic local summary covering the same two aspects), builds a PDF via `pdfkit` with a section per source, and saves a record to the `reports` table. Full loading state with step progression, success/error toasts, and a working PDF download.
- **Concert Schedule (Admin → Concert Schedule)**: full CRUD over many concerts (create, edit, delete history), plus Mulai Live/Akhiri Konser actions. Creating a schedule provisions a zeroed operational scaffold (finance, ticketing, crowd zones, trend buckets) so the dashboard has real rows to read the moment it goes Live.
- **Dark/light theme**: single-button toggle in the Navbar next to the notification bell (`src/store/themeStore.ts`) — flips a `.light` class on `<html>` that swaps a handful of CSS custom properties (`src/app/index.css`), re-theming every component with no per-component changes. Persisted to `localStorage`.
- **Responsive**: sidebar becomes a slide-in drawer on mobile/tablet (`<lg`), all grids collapse to single/double column.
- **Zustand stores**, one per domain: `authStore`, `dashboardStore`, `notificationStore`, `userStore`, `vendorStore`, `incidentStore`, `eventStore`, `referenceStore`, `themeStore`, `toastStore`. Every store hydrates from the Express API on load and pushes CRUD actions back to it — there are no static data files left in the frontend. Even the form dropdown options (role list, security teams, vendor categories) come from the database via `GET /api/reference`.

## What was removed (per "less is more")

Executive/Operations/Venue role split (6 roles → 3), Venue Management dashboard, Alert Center, Gate Monitoring, Sponsor Analytics, Staff Management, System Health — all deleted, not hidden, since none had real functionality and weren't in the revised role scope. Dead Export PDF/Excel/Share buttons that did nothing were removed wherever the AI report feature didn't replace them. The unused `@tanstack/react-table` dependency was removed (the project never actually used it — `DataTable` is hand-rolled). The Admin/EO's free-text field-report feature and its Manager-side inbox were removed in favor of the merged **Reports & Ticket Sales** page feeding the AI report directly; the Settings page was removed for every role (its only real setting, the theme, moved to a single Navbar toggle); the separate Ticket Sales page was folded into Reports.

## Setup

### 1. Database (PostgreSQL)
```bash
# create a database named eventify (adjust to your setup)
createdb eventify
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env        # set DATABASE_URL, optionally ANTHROPIC_API_KEY
npm run db:migrate          # creates tables + loads reference (lookup) data — see server/README.md to bootstrap the first login
npm run dev
```

### 3. Frontend
```bash
npm install
cp .env.example .env        # set VITE_API_BASE_URL if backend runs elsewhere
npm run dev
```

The backend must be running for the app to work now — every module (auth, dashboards, CRUD, notifications, reports) reads from and writes to PostgreSQL through the Express API. See `server/README.md` for the full endpoint list and database details.

## Project structure

```
src/
├── app/                 # entry, global styles + theme CSS variables (index.css)
├── auth/login/           # SplashSection, LoginFormSection, LoginPage (scrollable composition)
├── layouts/               # AppLayout, Sidebar (+ mobile drawer), Navbar (+ theme toggle), navConfig
├── dashboard/              # manager/ (Dashboard + Finance), admin/, security/
├── modules/                 # concert-schedule (+CRUD dialog), vendor-management (+CRUD dialog),
│                             # live-monitoring, crowd-monitoring (+attendance input),
│                             # incident-center (+CRUD dialogs), reports (Admin: merged
│                             # Reports & Ticket Sales; Manager: AI report), user-management (+CRUD dialog)
├── components/                 # GlassCard, KpiCard, StatusBadge, DataTable, ProgressBar,
│   └── ui/                     # CrowdHeatmap, SecurityHeatmap, Toaster
│                                 # dialog, select, input, label, button, confirm-dialog (shadcn-style)
├── routes/                      # router, ProtectedRoute, RoleRoute, ReportsRouter
├── store/                       # authStore, dashboardStore, notificationStore, userStore,
│                                 # vendorStore, incidentStore, eventStore, referenceStore,
│                                 # themeStore, toastStore (all fetch/mutate through src/services/api.ts)
├── services/                    # api (generic fetch client), reportService (report endpoint)
└── types/                       # domain types (3-role scope)

server/
└── src/
    ├── index.js              # Express app, mounts all routers
    ├── db/                   # schema.sql, seed.sql, pool.js (pg Pool, resolveActiveEventId), migrate.js
    ├── routes/               # auth, users, vendors, incidents, dashboard, notifications, reports,
    │                         # events, finance, ticketSales, attendance
    ├── services/             # incidents.js (metrics), events.js (new-concert scaffold provisioning)
    ├── utils/format.js       # Indonesian date/time + initials formatting shared by routes
    ├── claudeClient.js, insightGenerator.js, pdfBuilder.js   # AI report generation
```

## Database schema

See `server/src/db/schema.sql` for the full DDL. Summary:

- `events` — one row per concert (many rows now — Scheduled/Live/Ended); `resolveActiveEventId()` in `server/src/db/pool.js` picks which one every operational route reads/writes (Live, else the most recently Ended, else the newest Scheduled)
- `app_users` — auth + User Management
- `vendors` — Vendor Management
- `security_teams`, `incidents` — Incident Center
- `role_options`, `vendor_categories` — lookup tables backing the form dropdowns (served via `GET /api/reference`, alongside `security_teams`)
- `crowd_zones`, `density_trend` — Live/Crowd Monitoring
- `notifications`, `activity_feed` — bell panel
- `finance_summary`, `finance_breakdown`, `revenue_trend`, `ticket_summary`, `hourly_sales`, `daily_revenue`, `checkin_conversion` — Finance dashboard + Ticket Sales
- `reports` — persisted AI evaluation reports (PDF stored as base64)

## Known limitations

- Most KPI card "delta" figures (e.g. `+12.4%`) have no historical baseline table yet, so they remain the same illustrative values the dummy data shipped with — the underlying totals they're attached to are live from the database. Exception: the Security "Avg Response Time" KPI and the Incident Center metrics strip are now computed from real incident status-transition timestamps (`acknowledged_at` / `resolved_at`).
- Dependencies could not be installed or the app build-verified against a live PostgreSQL instance in the sandbox this was authored in (no network egress, no root to install PostgreSQL). Every SQL file, JS file (`node --check`), and TypeScript file (`tsc --noEmit`, whole project, zero errors) has been syntax/type-checked; seed data column counts and enum values were cross-checked by hand against the schema. Please run `npm run db:migrate` and `npm run dev` (both `/` and `/server`) locally and report back if anything needs adjusting.
