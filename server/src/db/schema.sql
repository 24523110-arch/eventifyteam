-- =====================================================================
-- Eventify — PostgreSQL schema
-- Concert Management System (Manager / Admin-EO / Security roles)
--
-- Mirrors the domain model in src/types/index.ts and the dummy data in
-- src/data/*.ts, so the existing frontend contracts keep working once
-- wired to the API. Idempotent: safe to run multiple times.
-- =====================================================================

-- pgcrypto powers crypt()/gen_salt('bf') for bcrypt password hashing
-- directly in SQL, so the Node backend never needs a native bcrypt
-- dependency. Available by default on Docker/Homebrew/RDS/Supabase/Neon.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('manager', 'admin', 'security');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('not_arrived', 'check_in', 'setup', 'ready', 'active', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM ('new', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crowd_zone_status AS ENUM ('safe', 'busy', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM ('security', 'finance', 'vendor', 'ticket', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- Events — Eventify supports one live concert today, modeled as a table
-- so the schema extends to multiple concerts without breaking changes.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  venue             TEXT NOT NULL,
  event_date        TEXT NOT NULL,       -- kept as display text ("19 Juni 2026") to match ConcertInfo.date
  status            TEXT NOT NULL DEFAULT 'Live',
  current_performer TEXT NOT NULL DEFAULT '',
  capacity          INTEGER NOT NULL CHECK (capacity >= 0),
  attendance        INTEGER NOT NULL DEFAULT 0 CHECK (attendance >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Role options (lookup) — labels/descriptions for the 3 fixed roles,
-- served to the login role selector and User Management forms so the
-- frontend never hardcodes them.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_options (
  value       user_role PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- Users (auth + User Management module)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_users (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  role             user_role NOT NULL,
  avatar_initials  TEXT NOT NULL,
  status           user_status NOT NULL DEFAULT 'active',
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Vendors (Vendor Management module — Admin)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
  id             TEXT PRIMARY KEY,
  event_id       TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,
  arrival_time   TEXT NOT NULL,          -- "HH:MM" display string, matches Vendor.arrivalTime
  status         vendor_status NOT NULL DEFAULT 'not_arrived',
  assigned_area  TEXT NOT NULL,
  contact        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_event ON vendors(event_id);

-- Vendor categories (lookup) — options for the Vendor Management form.
CREATE TABLE IF NOT EXISTS vendor_categories (
  name       TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- Security teams (lookup) + Incidents (Incident Center — Security)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_teams (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS incidents (
  id             TEXT PRIMARY KEY,        -- "INC-0042" style, generated by the API
  event_id       TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  area           TEXT NOT NULL,
  severity       incident_severity NOT NULL,
  assigned_team  TEXT NOT NULL DEFAULT 'Unassigned' REFERENCES security_teams(name),
  status         incident_status NOT NULL DEFAULT 'new',
  description    TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_event ON incidents(event_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);

-- Response-time tracking: when an incident was first acknowledged (moved off
-- "new") and when it was resolved/closed. Powers the "< 8 min response" metric.
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------
-- Crowd monitoring (Live/Crowd Monitoring — Security)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crowd_zones (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  capacity   INTEGER NOT NULL CHECK (capacity >= 0),
  current    INTEGER NOT NULL DEFAULT 0 CHECK (current >= 0),
  status     crowd_zone_status NOT NULL DEFAULT 'safe',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crowd_zones_event ON crowd_zones(event_id);

CREATE TABLE IF NOT EXISTS density_trend (
  id         SERIAL PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  time_label TEXT NOT NULL,               -- "14:00"
  density    INTEGER NOT NULL CHECK (density >= 0 AND density <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_density_trend_event ON density_trend(event_id, sort_order);

-- ---------------------------------------------------------------------
-- Notifications + activity feed (bell panel)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category    notification_category NOT NULL,
  priority    notification_priority NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  time_label  TEXT NOT NULL,              -- "20:09" display string, matches NotificationItem.time
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_event ON notifications(event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_feed (
  id          TEXT PRIMARY KEY,
  event_id    TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  time_label  TEXT NOT NULL,              -- "20:14:02"
  message     TEXT NOT NULL,
  category    notification_category NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_event ON activity_feed(event_id, created_at DESC);

-- ---------------------------------------------------------------------
-- Finance / ticketing (Finance dashboard, Ticket Sales — Manager/Admin)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_summary (
  event_id  TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  revenue   NUMERIC(18, 2) NOT NULL DEFAULT 0,
  expenses  NUMERIC(18, 2) NOT NULL DEFAULT 0,
  profit    NUMERIC(18, 2) NOT NULL DEFAULT 0,
  margin    NUMERIC(5, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS finance_breakdown (
  id       SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount   NUMERIC(18, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_finance_breakdown_event ON finance_breakdown(event_id);

CREATE TABLE IF NOT EXISTS revenue_trend (
  id           SERIAL PRIMARY KEY,
  event_id     TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  time_label   TEXT NOT NULL,             -- "14:00"
  revenue      NUMERIC(18, 2) NOT NULL DEFAULT 0,   -- in the frontend's "Rp juta" unit, e.g. 12.4
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_revenue_trend_event ON revenue_trend(event_id, sort_order);

CREATE TABLE IF NOT EXISTS ticket_summary (
  event_id  TEXT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  sold      INTEGER NOT NULL DEFAULT 0,
  revenue   NUMERIC(18, 2) NOT NULL DEFAULT 0,
  refunds   INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hourly_sales (
  id         SERIAL PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  hour_label TEXT NOT NULL,               -- "08:00"
  tickets    INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hourly_sales_event ON hourly_sales(event_id, sort_order);

CREATE TABLE IF NOT EXISTS daily_revenue (
  id         SERIAL PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  day_label  TEXT NOT NULL,               -- "Sen"
  revenue    NUMERIC(18, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_daily_revenue_event ON daily_revenue(event_id, sort_order);

CREATE TABLE IF NOT EXISTS checkin_conversion (
  id         SERIAL PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stage      TEXT NOT NULL,
  value      INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_checkin_conversion_event ON checkin_conversion(event_id, sort_order);

-- ---------------------------------------------------------------------
-- AI evaluation reports (Manager → Reports)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id                 TEXT PRIMARY KEY,
  event_id           TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  generated_by       TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  generated_at_label TEXT NOT NULL,       -- Indonesian long-form string shown in the UI
  insight            TEXT NOT NULL,
  pdf_base64         TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_event ON reports(event_id, created_at DESC);
