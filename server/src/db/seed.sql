-- =====================================================================
-- Eventify — seed data
--
-- Reference/lookup data only — no demo concerts, users, vendors, or
-- incidents. The app starts with an empty operational dataset; the very
-- first Manager account must be created directly in the database (see
-- server/README.md), after which that Manager can create every other
-- account through User Management (POST /api/users, password included).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Reference / lookup data — applied idempotently on every migrate so the
-- frontend can read roles, teams, and vendor categories from the API
-- instead of hardcoding them. This is fixed configuration, not sample
-- business data, so it's safe to always keep seeded.
-- ---------------------------------------------------------------------
INSERT INTO role_options (value, label, description, sort_order) VALUES
  ('manager',  'Manager',                 'Business evaluation, finance & reporting', 1),
  ('admin',    'Admin / Event Organizer', 'Tickets, vendors & operations',            2),
  ('security', 'Security Team',           'Crowd safety & incident response',         3)
ON CONFLICT (value) DO NOTHING;

INSERT INTO security_teams (name) VALUES
  ('Security Alpha'), ('Security Bravo'), ('Security Charlie'), ('Security Delta'), ('Unassigned')
ON CONFLICT (name) DO NOTHING;

INSERT INTO vendor_categories (name, sort_order) VALUES
  ('F&B', 1), ('Technical', 2), ('Security', 3), ('Merchandise', 4), ('Facilities', 5)
ON CONFLICT (name) DO NOTHING;
