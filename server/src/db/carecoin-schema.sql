-- CareCoin database schema
-- Run in pgAdmin against a fresh database (see CREATE DATABASE below, run separately if needed)

-- CREATE DATABASE carecoin;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- medicines
-- ============================================================
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  side_effects TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- medicine_variants
-- form/strength both optional, matching the schema decision that
-- quick-create shouldn't block on knowing either. form's allowed
-- values (MEDICINE_FORMS) live only in shared-types — validated
-- at the API layer, not enforced in the DB, to avoid duplicating
-- that list in two places.
-- ============================================================
CREATE TABLE medicine_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  form TEXT,
  strength TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medicine_variants_medicine_id ON medicine_variants(medicine_id);

-- ============================================================
-- doctors
-- ============================================================
CREATE TABLE doctors (
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

-- ============================================================
-- prescriptions
-- ============================================================
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  date DATE NOT NULL,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);

-- ============================================================
-- prescription_medicines
-- Join entity — one row per medicine variant per prescription.
-- ============================================================
CREATE TABLE prescription_medicines (
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

CREATE INDEX idx_prescription_medicines_prescription_id ON prescription_medicines(prescription_id);
CREATE INDEX idx_prescription_medicines_variant_id ON prescription_medicines(medicine_variant_id);

-- ============================================================
-- updated_at auto-touch trigger
-- Keeps updated_at accurate without every UPDATE query having to
-- remember to set it manually.
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medicines_updated_at
  BEFORE UPDATE ON medicines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_medicine_variants_updated_at
  BEFORE UPDATE ON medicine_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prescription_medicines_updated_at
  BEFORE UPDATE ON prescription_medicines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();