# Eventify — Concert Management System (Revised)

Dark neon purple, glassmorphism concert MIS — revised down to 3 roles with fully functional CRUD, a scrollable splash/login page, and an AI-assisted PDF evaluation report. Built with React 18, TypeScript, Vite, TailwindCSS, Radix UI (shadcn-style components), Framer Motion, Recharts, and Zustand. Backend is Express + PostgreSQL, plus `pdfkit` for report generation.

## Roles & access

| Role | Pages |
|---|---|
| **Manager** | Dashboard, Finance, Reports (AI evaluation report **+ incoming field reports from the EO**), User Management, Settings |
| **Admin / Event Organizer** | Dashboard, **Concert Schedule** (multi-event CRUD + Mulai Live/Akhiri Konser), Ticket Sales, Vendor Management, Reports (operational **+ submit field reports**), Settings |
| **Security Team** | Dashboard, Live Monitoring, Crowd Monitoring, Incident Center, Settings |

**Reporting flow (EO → Manager → AI):** the Admin/Event Organizer monitors the concert on-site and files manual **field reports** (Operasional / Vendor / Tiket / Umum — security topics are excluded, that's the Security Team's own Incident Center). Field reports land in the Manager's Reports view in real time and ping the Manager's bell. When the Manager clicks **Generate Evaluation Report**, the backend assembles ticket/finance data + all field reports from the EO + the Security Team's incident record (counts by severity, resolution status, avg response time) for the active concert, and hands all of it to Claude for one detailed narrative evaluation — the PDF includes dedicated sections for each source.

**Concert schedule:** the Admin/Event Organizer manages many concerts — Scheduled (belum berlangsung), Live (sedang berlangsung), or Ended (riwayat, editable/deletable). Only one concert is Live at a time; starting a new one automatically ends whichever was previously Live. Every operational module (dashboards, vendors, incidents, notifications, field reports, the live simulator) automatically follows whichever concert is Live — real-time monitoring runs while `Live` and freezes the moment it's marked `Ended`.

**Notifications are role-specific**: Security sees incident/security alerts, Admin sees vendor/ticket updates, Manager sees finance/report/system — plus untargeted `system` announcements (like concert status changes) reach everyone.

Menus are hidden (not disabled) per role in the sidebar, and routes are guarded client-side via `RoleRoute` — visiting another role's URL directly redirects to your own dashboard. Access is **also enforced server-side**: login issues a JWT, every API request carries it as a Bearer token, and writes are restricted to the owning role (a security user cannot `POST /api/users`, etc.). The session persists across refreshes and is cleared on 401.

Demo accounts (shown on the login screen):
```
manager@eventify.io  / manager123
admin@eventify.io    / admin123
security@eventify.io / security123
```

## What's functional

- **Splash + Login**: scrollable landing hero above a real login form — email format validation, password length validation, role selector, remember me, loading state, inline + banner error messages, redirect to the correct dashboard per role. Auth is checked against PostgreSQL (`POST /api/auth/login`, bcrypt via `pgcrypto`).
- **CRUD (Shadcn-style Dialog + Select, all wired to Zustand stores → REST API → PostgreSQL)**:
  - User Management (Manager) — create, edit, enable/disable, delete, search
  - Vendor Management (Admin) — create, edit, delete, search, status filter
  - Incident Center (Security) — create, edit, delete, search, status actions (Escalate/Resolve/Close) in a detail dialog
- **Notifications**: bell panel opens, mark-as-read, mark-all-as-read, clear all — all persisted.
- **AI Concert Evaluation Report (Manager → Reports)**: one click triggers the backend, which assembles ticket/finance data, the EO's field reports, and the Security Team's incident summary for the active concert, generates a narrative insight (Claude API if `ANTHROPIC_API_KEY` is set server-side, else a deterministic local summary covering the same three aspects), builds a PDF via `pdfkit` with a section per source, and saves a record to the `reports` table. Full loading state with step progression, success/error toasts, and a working PDF download.
- **Concert Schedule (Admin → Concert Schedule)**: full CRUD over many concerts (create, edit, delete history), plus Mulai Live/Akhiri Konser actions. Creating a schedule provisions a zeroed operational scaffold (finance, ticketing, crowd zones, trend buckets) so the dashboard and live simulator have real data the moment it goes Live.
- **Responsive**: sidebar becomes a slide-in drawer on mobile/tablet (`<lg`), all grids collapse to single/double column.
- **Zustand stores**, one per domain: `authStore`, `dashboardStore`, `notificationStore`, `userStore`, `vendorStore`, `incidentStore`, `referenceStore`, `settingsStore`, `toastStore`. Every store hydrates from the Express API on load and pushes CRUD actions back to it — there are no static data files left in the frontend. Even the form dropdown options (role list, security teams, vendor categories) come from the database via `GET /api/reference`.

## What was removed (per "less is more")

Executive/Operations/Venue role split (6 roles → 3), Venue Management dashboard, Alert Center, Gate Monitoring, Sponsor Analytics, Staff Management, System Health — all deleted, not hidden, since none had real functionality and weren't in the revised role scope. Dead Export PDF/Excel/Share buttons that did nothing were removed wherever the AI report feature didn't replace them. The unused `@tanstack/react-table` dependency was removed (the project never actually used it — `DataTable` is hand-rolled).

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
npm run db:migrate          # creates tables + loads seed data
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
├── app/                 # entry, global styles
├── auth/login/           # SplashSection, LoginFormSection, LoginPage (scrollable composition)
├── layouts/               # AppLayout, Sidebar (+ mobile drawer), Navbar, navConfig (per-role menus)
├── dashboard/              # manager/ (Dashboard + Finance), admin/, security/
├── modules/                 # ticket-sales, vendor-management (+CRUD dialog), live-monitoring,
│                             # crowd-monitoring, incident-center (+CRUD dialogs), reports,
│                             # user-management (+CRUD dialog)
├── pages/settings/            # SettingsPage
├── components/                 # GlassCard, KpiCard, StatusBadge, DataTable, ProgressBar,
│   └── ui/                     # CrowdHeatmap, SecurityHeatmap, Toaster
│                                 # dialog, select, input, label, button, confirm-dialog (shadcn-style)
├── routes/                      # router, ProtectedRoute, RoleRoute, ReportsRouter
├── store/                       # authStore, dashboardStore, notificationStore, userStore,
│                                 # vendorStore, incidentStore, referenceStore, settingsStore,
│                                 # toastStore (all fetch/mutate through src/services/api.ts)
├── services/                    # api (generic fetch client), reportService (report endpoint)
└── types/                       # domain types (3-role scope)

server/
└── src/
    ├── index.js              # Express app, mounts all routers
    ├── db/                   # schema.sql, seed.sql, pool.js (pg Pool), migrate.js
    ├── routes/               # auth, users, vendors, incidents, dashboard, notifications, reports
    ├── utils/format.js       # Indonesian date/time + initials formatting shared by routes
    ├── claudeClient.js, insightGenerator.js, pdfBuilder.js   # AI report generation
```

## Database schema

See `server/src/db/schema.sql` for the full DDL. Summary:

- `events` — one row per concert (many rows now — Scheduled/Live/Ended); `resolveActiveEventId()` in `server/src/db/pool.js` picks which one every operational route reads/writes (Live, else the most recently Ended, else the newest Scheduled)
- `field_reports` — manual on-site reports from the Admin/EO, folded into the AI evaluation report
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
