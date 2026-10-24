-- CareCoin database schema
-- Idempotent: safe to re-run against an existing database. Run once to create
-- from scratch, or again after pulling schema changes to apply just the diff.

-- CREATE DATABASE carecoin;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- medicines
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  side_effects TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE medicines
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ============================================================
-- medicine_variants
-- form/strength both optional, matching the schema decision that
-- quick-create shouldn't block on knowing either. form's allowed
-- values (MEDICINE_FORMS) live only in shared-types — validated
-- at the API layer, not enforced in the DB, to avoid duplicating
-- that list in two places.
-- ============================================================
CREATE TABLE IF NOT EXISTS medicine_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  form TEXT,
  strength TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicine_variants_medicine_id ON medicine_variants(medicine_id);

ALTER TABLE medicine_variants
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ============================================================
-- doctors
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  clinic_name TEXT,
  city TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ============================================================
-- prescriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  date DATE NOT NULL,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);

-- ============================================================
-- prescription_medicines
-- Join entity — one row per medicine variant per prescription.
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_variant_id UUID NOT NULL REFERENCES medicine_variants(id),
  frequency TEXT,
  reason TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescription_medicines_prescription_id ON prescription_medicines(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_medicines_variant_id ON prescription_medicines(medicine_variant_id);

-- ============================================================
-- expenses
-- domain is validated at the API layer (like medicine_variants.form),
-- so its allowed values are not duplicated here.
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'health',
  linked_prescription_id UUID REFERENCES prescriptions(id),
  linked_medicine_variant_id UUID REFERENCES medicine_variants(id),
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- description: free-text item name/details (e.g. test name). Capped at 200 chars by the API.
-- source: where the row came from ('manual' | 'import'). Server-owned, never sent by clients.
-- Allowed values (EXPENSE_SOURCES) live only in shared-types, like domain and form.
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_expenses_prescriptions_id ON expenses(linked_prescription_id);
CREATE INDEX IF NOT EXISTS idx_expenses_medicine_variants_id ON expenses(linked_medicine_variant_id);

-- ============================================================
-- updated_at auto-touch trigger
-- Keeps updated_at accurate without every UPDATE query having to
-- remember to set it manually.
-- CREATE OR REPLACE FUNCTION is already idempotent by nature.
-- CREATE TRIGGER has no IF NOT EXISTS in Postgres < 14, so each
-- trigger is dropped first, then recreated — safe to re-run.
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medicines_updated_at ON medicines;
CREATE TRIGGER trg_medicines_updated_at
  BEFORE UPDATE ON medicines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_medicine_variants_updated_at ON medicine_variants;
CREATE TRIGGER trg_medicine_variants_updated_at
  BEFORE UPDATE ON medicine_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_doctors_updated_at ON doctors;
CREATE TRIGGER trg_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER trg_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_prescription_medicines_updated_at ON prescription_medicines;
CREATE TRIGGER trg_prescription_medicines_updated_at
  BEFORE UPDATE ON prescription_medicines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- DEV ONLY: wipe all data (keeps tables, indexes, triggers)
-- Commented out on purpose: this file is meant to be re-run safely,
-- and an active TRUNCATE would delete everything on every run.
-- To use: select the block below, uncomment it, and run it by itself.
-- NEVER run against a database holding real data you want to keep.
-- ============================================================
-- TRUNCATE TABLE
--   expenses,
--   prescription_medicines,
--   prescriptions,
--   medicine_variants,
--   medicines,
--   doctors
-- RESTART IDENTITY CASCADE;
--
-- Notes:
--   * One statement lists every table, so Postgres handles the foreign keys
--     (expenses -> prescriptions/medicine_variants, prescriptions -> doctors, etc.).
--     CASCADE also empties any table added later that references these.
--   * RESTART IDENTITY is harmless here (ids are UUIDs, not sequences) but keeps
--     the statement correct if a serial column is ever added.
--   * To re-seed afterwards, run seed.sql.
--
-- Only want to clear expenses (e.g. to re-test the CSV import)?
--   TRUNCATE TABLE expenses;
--
-- Only want to remove imported expenses, keeping manual ones?
--   DELETE FROM expenses WHERE source = 'import';
-- Medicines/variants created by an import are not removed by that; delete them
-- by hand if needed.