-- =====================================================================
-- Eventify — seed data
-- Mirrors src/data/*.ts exactly so the app behaves the same after the
-- switch from in-memory dummy data to PostgreSQL. Wrapped in a single
-- idempotent block: running it twice will not duplicate rows.
--
-- Demo login passwords (same as README):
--   manager@eventify.io  / manager123
--   admin@eventify.io    / admin123
--   security@eventify.io / security123
-- Non-login demo users (Maya, Fajar, Budi) get a placeholder password
-- "changeme123" — change it before using them for real auth.
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE id = 'evt-001') THEN
    RAISE NOTICE 'Eventify seed data already present — skipping.';
    RETURN;
  END IF;

  -- Event -------------------------------------------------------------
  INSERT INTO events (id, name, venue, event_date, status, current_performer, capacity, attendance) VALUES
    ('evt-001', 'Coldplay — Music of the Spheres World Tour', 'Gelora Bung Karno Stadium, Jakarta', '19 Juni 2026', 'Live', 'Coldplay — Main Set', 60000, 48210);

  -- Users ---------------------------------------------------------------
  INSERT INTO app_users (id, name, email, password_hash, role, avatar_initials, status, last_login_at) VALUES
    ('u-001', 'Raka Pratama',     'manager@eventify.io',  crypt('manager123',  gen_salt('bf')), 'manager',  'RP', 'active',   '2026-06-19 19:42:00+07'),
    ('u-002', 'Dewi Anggraini',   'admin@eventify.io',    crypt('admin123',    gen_salt('bf')), 'admin',    'DA', 'active',   '2026-06-19 18:10:00+07'),
    ('u-003', 'Andi Wijaya',      'security@eventify.io', crypt('security123', gen_salt('bf')), 'security', 'AW', 'active',   '2026-06-19 19:50:00+07'),
    ('u-004', 'Maya Kusuma',      'maya.k@eventify.io',   crypt('changeme123', gen_salt('bf')), 'manager',  'MK', 'active',   '2026-06-18 16:30:00+07'),
    ('u-005', 'Fajar Nugroho',    'fajar.n@eventify.io',  crypt('changeme123', gen_salt('bf')), 'admin',    'FN', 'active',   '2026-06-18 17:55:00+07'),
    ('u-006', 'Budi Santoso',     'budi.s@eventify.io',   crypt('changeme123', gen_salt('bf')), 'security', 'BS', 'disabled', '2026-06-17 15:20:00+07');

  -- Vendors ---------------------------------------------------------------
  INSERT INTO vendors (id, event_id, name, category, arrival_time, status, assigned_area, contact) VALUES
    ('v1', 'evt-001', 'Sari Roti Catering',            'F&B',          '08:00', 'active',      'Food Court',         '081234567801'),
    ('v2', 'evt-001', 'Stage Rigging Co.',             'Technical',    '06:00', 'completed',   'Main Stage',         '081234567802'),
    ('v3', 'evt-001', 'Nusantara Security Services',   'Security',     '07:00', 'active',      'All Gates',          '081234567803'),
    ('v4', 'evt-001', 'Pure Water Indonesia',          'F&B',          '09:00', 'ready',       'Hydration Stations', '081234567804'),
    ('v5', 'evt-001', 'LiveSound Audio',               'Technical',    '05:30', 'active',      'Main Stage',         '081234567805'),
    ('v6', 'evt-001', 'Merch Hub Indonesia',           'Merchandise',  '10:00', 'setup',       'VIP',                '081234567806'),
    ('v7', 'evt-001', 'CleanCity Sanitation',          'Facilities',   '06:30', 'active',      'Parking',            '081234567807'),
    ('v8', 'evt-001', 'Java Coffee Cart',               'F&B',          '11:00', 'not_arrived', 'Food Court',         '081234567808');

  -- Security teams + incidents -------------------------------------------
  INSERT INTO security_teams (name) VALUES
    ('Security Alpha'), ('Security Bravo'), ('Security Charlie'), ('Security Delta'), ('Unassigned');

  INSERT INTO incidents (id, event_id, area, severity, assigned_team, status, description, created_at) VALUES
    ('INC-0042', 'evt-001', 'Gate B',      'high',     'Security Alpha',   'resolved',    'Overcrowding near barrier line 3',            '2026-06-19 19:48:00+07'),
    ('INC-0043', 'evt-001', 'Food Court',  'low',      'Security Bravo',   'closed',      'Minor altercation between vendors',           '2026-06-19 19:55:00+07'),
    ('INC-0044', 'evt-001', 'VIP',         'medium',   'Security Charlie', 'in_progress', 'Unauthorized access attempt at VIP entrance', '2026-06-19 20:02:00+07'),
    ('INC-0045', 'evt-001', 'Main Stage',  'critical', 'Security Alpha',   'escalated',   'Crowd surge detected near front barrier',     '2026-06-19 20:09:00+07'),
    ('INC-0046', 'evt-001', 'Parking',     'low',      'Unassigned',       'new',         'Reported vehicle blocking emergency lane',    '2026-06-19 20:13:00+07');

  -- Crowd zones + density trend -------------------------------------------
  INSERT INTO crowd_zones (id, event_id, name, capacity, current, status) VALUES
    ('z1', 'evt-001', 'Main Stage',  30000, 27600, 'busy'),
    ('z2', 'evt-001', 'VIP',          4000,  3850, 'busy'),
    ('z3', 'evt-001', 'Gate A',       8000,  4200, 'safe'),
    ('z4', 'evt-001', 'Gate B',       8000,  7600, 'critical'),
    ('z5', 'evt-001', 'Food Court',   6000,  2900, 'safe'),
    ('z6', 'evt-001', 'Parking',     12000,  5400, 'safe');

  INSERT INTO density_trend (event_id, time_label, density, sort_order) VALUES
    ('evt-001', '14:00', 38, 1),
    ('evt-001', '15:00', 52, 2),
    ('evt-001', '16:00', 64, 3),
    ('evt-001', '17:00', 71, 4),
    ('evt-001', '18:00', 78, 5),
    ('evt-001', '19:00', 83, 6),
    ('evt-001', '20:00', 80, 7);

  -- Notifications + activity feed -------------------------------------------
  INSERT INTO notifications (id, event_id, category, priority, title, message, time_label, is_read) VALUES
    ('al1', 'evt-001', 'security', 'critical', 'Crowd surge — Main Stage',   'Density exceeded 95% capacity near front barrier', '20:09', FALSE),
    ('al2', 'evt-001', 'security', 'high',     'Gate B queue critical',      'Queue length 740, waiting time 19 min',            '20:05', FALSE),
    ('al3', 'evt-001', 'finance',  'medium',   'Revenue milestone',          'Ticket revenue passed Rp 80M',                     '20:01', TRUE),
    ('al4', 'evt-001', 'vendor',   'low',      'Vendor check-in complete',   'Sari Roti Catering marked Active',                 '19:54', TRUE),
    ('al5', 'evt-001', 'system',   'medium',   'Backup server activated',    'Primary API latency spike triggered failover',     '19:40', TRUE);

  INSERT INTO activity_feed (id, event_id, time_label, message, category) VALUES
    ('a1', 'evt-001', '20:14:02', 'Gate B queue exceeded threshold (7,600 / 8,000)', 'security'),
    ('a2', 'evt-001', '20:11:45', 'Sponsor booth recorded 1,204 visitors',           'finance'),
    ('a3', 'evt-001', '20:08:19', 'Security team Alpha resolved Incident #INC-0042', 'security'),
    ('a4', 'evt-001', '20:05:51', 'Vendor "Sari Roti Catering" marked Active',       'vendor'),
    ('a5', 'evt-001', '20:01:37', 'Revenue milestone reached: Rp 80M',               'finance'),
    ('a6', 'evt-001', '19:58:02', 'System backup server health check passed',        'system');

  -- Finance / ticketing -------------------------------------------
  INSERT INTO finance_summary (event_id, revenue, expenses, profit, margin) VALUES
    ('evt-001', 84600000000, 31200000000, 53400000000, 63.10);

  INSERT INTO finance_breakdown (event_id, category, amount) VALUES
    ('evt-001', 'Vendor',     9800000000),
    ('evt-001', 'Venue',      8200000000),
    ('evt-001', 'Security',   4600000000),
    ('evt-001', 'Marketing',  5400000000),
    ('evt-001', 'Operations', 3200000000);

  INSERT INTO revenue_trend (event_id, time_label, revenue, tickets_sold, sort_order) VALUES
    ('evt-001', '14:00', 12.4, 4200,  1),
    ('evt-001', '15:00', 24.1, 8100,  2),
    ('evt-001', '16:00', 38.7, 12400, 3),
    ('evt-001', '17:00', 52.3, 16800, 4),
    ('evt-001', '18:00', 64.9, 21200, 5),
    ('evt-001', '19:00', 76.2, 25100, 6),
    ('evt-001', '20:00', 84.6, 27600, 7);

  INSERT INTO ticket_summary (event_id, sold, revenue, refunds, remaining) VALUES
    ('evt-001', 48210, 84600000000, 312, 11790);

  INSERT INTO hourly_sales (event_id, hour_label, tickets, sort_order) VALUES
    ('evt-001', '08:00', 1200, 1),
    ('evt-001', '10:00', 2400, 2),
    ('evt-001', '12:00', 4100, 3),
    ('evt-001', '14:00', 6800, 4),
    ('evt-001', '16:00', 5200, 5),
    ('evt-001', '18:00', 3900, 6),
    ('evt-001', '20:00', 1600, 7);

  INSERT INTO daily_revenue (event_id, day_label, revenue, sort_order) VALUES
    ('evt-001', 'Sen', 12.1, 1),
    ('evt-001', 'Sel', 18.4, 2),
    ('evt-001', 'Rab', 22.7, 3),
    ('evt-001', 'Kam', 31.2, 4),
    ('evt-001', 'Jum', 48.6, 5),
    ('evt-001', 'Sab', 71.3, 6),
    ('evt-001', 'Min', 84.6, 7);

  INSERT INTO checkin_conversion (event_id, stage, value, sort_order) VALUES
    ('evt-001', 'Tickets Sold',  48210, 1),
    ('evt-001', 'Gate Scanned',  46890, 2),
    ('evt-001', 'Checked In',    45120, 3),
    ('evt-001', 'Inside Venue',  44310, 4);

  RAISE NOTICE 'Eventify seed data inserted.';
END $$;
