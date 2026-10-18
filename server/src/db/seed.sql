-- CareCoin seed data
-- Run after schema.sql, against the carecoin database.
-- Idempotent: every insert uses ON CONFLICT (id) DO NOTHING, so it is safe to re-run.
-- Rows that already exist are left untouched, so edits you made to seeded rows are kept.
-- To restore seeded rows to their original values, delete them first or reset the database.
-- Mirrors the dummyDoctors/dummyMedicines/dummyPrescriptions used during frontend development.

-- ============================================================
-- doctors
-- ============================================================
INSERT INTO doctors (id, name, specialty, clinic_name, city, phone, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dr. Ananya Shah', 'General Physician', 'CityCare Clinic', 'Pune', '+91 98765 43210', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Dr. Rohan Mehta', 'Orthopedic', 'Bone & Joint Center', 'Bangalore', '+91 98123 45678', 'Prefers evening appointments; follow-up every 3 months.'),
  ('33333333-3333-3333-3333-333333333333', 'Dr. Priya Nair', 'Dermatologist', 'Skin & Glow Clinic', 'Mumbai', NULL, NULL),
  ('44444444-4444-4444-4444-444444444444', 'Dr. Arjun Verma', NULL, NULL, 'Pune', '+91 90000 11223', NULL),
  ('55555555-5555-5555-5555-555555555555', 'Dr. Kavita Reddy', 'Gynecologist', 'Women''s Wellness Center', 'Bangalore', NULL, 'Referred by Dr. Ananya Shah.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- medicines
-- ============================================================
INSERT INTO medicines (id, name, side_effects) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Metformin', 'Mild nausea when taken without food.'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Atorvastatin', NULL),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'Amoxicillin', 'Allergic reaction — rash observed once in 2023.'),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'Volini', NULL),
  ('aaaaaaaa-0005-0005-0005-000000000005', 'Crocin', NULL),
  ('aaaaaaaa-0006-0006-0006-000000000006', 'Ibuprofen', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- medicine_variants
-- ============================================================
INSERT INTO medicine_variants (id, medicine_id, form, strength) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', 'tablet', '500mg'),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'aaaaaaaa-0001-0001-0001-000000000001', 'tablet', '1000mg'),
  ('bbbbbbbb-0003-0003-0003-000000000003', 'aaaaaaaa-0002-0002-0002-000000000002', 'tablet', '10mg'),
  ('bbbbbbbb-0004-0004-0004-000000000004', 'aaaaaaaa-0002-0002-0002-000000000002', 'tablet', '20mg'),
  ('bbbbbbbb-0005-0005-0005-000000000005', 'aaaaaaaa-0003-0003-0003-000000000003', 'capsule', '250mg'),
  ('bbbbbbbb-0006-0006-0006-000000000006', 'aaaaaaaa-0003-0003-0003-000000000003', 'liquid-syrup', '125mg/5ml'),
  ('bbbbbbbb-0007-0007-0007-000000000007', 'aaaaaaaa-0004-0004-0004-000000000004', 'topical', NULL),
  ('bbbbbbbb-0008-0008-0008-000000000008', 'aaaaaaaa-0005-0005-0005-000000000005', 'tablet', '650mg')
ON CONFLICT (id) DO NOTHING;
  -- Ibuprofen intentionally has no variants — freshly quick-created, matches earlier dummy data

-- ============================================================
-- prescriptions
-- ============================================================
INSERT INTO prescriptions (id, doctor_id, date, notes, image_url) VALUES
  ('cccccccc-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', '2026-01-05', 'Routine diabetes checkup.', NULL),
  ('cccccccc-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', '2026-02-10', 'Follow-up for lower back pain.', '/uploads/presc_2.jpg'),
  ('cccccccc-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', '2026-03-02', NULL, NULL),
  ('cccccccc-0004-0004-0004-000000000004', '44444444-4444-4444-4444-444444444444', '2026-03-20', 'General consultation, no prescription needed yet.', NULL)
ON CONFLICT (id) DO NOTHING;
  -- presc_4 intentionally has no prescription_medicines rows

-- ============================================================
-- prescription_medicines
-- ============================================================
INSERT INTO prescription_medicines (id, prescription_id, medicine_variant_id, frequency, reason, start_date, end_date) VALUES
  ('eeeeeeee-0001-0001-0001-000000000001', 'cccccccc-0001-0001-0001-000000000001', 'bbbbbbbb-0001-0001-0001-000000000001', '2x daily', 'Diabetes management', '2026-01-05', NULL),
  ('eeeeeeee-0002-0002-0002-000000000002', 'cccccccc-0001-0001-0001-000000000001', 'bbbbbbbb-0003-0003-0003-000000000003', '1x nightly', 'Cholesterol control', '2026-01-05', NULL),
  ('eeeeeeee-0003-0003-0003-000000000003', 'cccccccc-0002-0002-0002-000000000002', 'bbbbbbbb-0008-0008-0008-000000000008', 'As needed', 'Back pain', '2026-02-10', '2026-02-20'),
  ('eeeeeeee-0004-0004-0004-000000000004', 'cccccccc-0002-0002-0002-000000000002', 'bbbbbbbb-0007-0007-0007-000000000007', '2x daily, apply on affected area', 'Back pain', '2026-02-10', '2026-02-20'),
  ('eeeeeeee-0005-0005-0005-000000000005', 'cccccccc-0003-0003-0003-000000000003', 'bbbbbbbb-0005-0005-0005-000000000005', '3x daily after meals', 'Throat infection', '2026-03-02', '2026-03-09')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- expenses
-- Mix of linked and unlinked rows (domain 'health' only until v2):
--   exp_1, exp_3, exp_4 linked to a prescription
--   exp_2               linked to a prescription and a medicine variant
--   exp_5               linked to a medicine variant only (price tracking)
--   exp_6               unlinked, has a receipt
-- ============================================================
INSERT INTO expenses (id, amount, date, category, domain, linked_prescription_id, linked_medicine_variant_id, receipt_url, description) VALUES
  ('dddddddd-0001-0001-0001-000000000001', 600.00, '2026-01-05', 'consultation', 'health', 'cccccccc-0001-0001-0001-000000000001', NULL, NULL, NULL),
  ('dddddddd-0002-0002-0002-000000000002', 185.50, '2026-01-06', 'medicines', 'health', 'cccccccc-0001-0001-0001-000000000001', 'bbbbbbbb-0001-0001-0001-000000000001', NULL, NULL),
  ('dddddddd-0003-0003-0003-000000000003', 800.00, '2026-02-10', 'consultation', 'health', 'cccccccc-0002-0002-0002-000000000002', NULL, NULL, 'Lower back pain follow-up'),
  ('dddddddd-0004-0004-0004-000000000004', 1200.00, '2026-03-02', 'consultation', 'health', 'cccccccc-0003-0003-0003-000000000003', NULL, NULL, NULL),
  ('dddddddd-0005-0005-0005-000000000005', 215.00, '2026-02-11', 'medicines', 'health', NULL, 'bbbbbbbb-0007-0007-0007-000000000007', NULL, NULL),
  ('dddddddd-0006-0006-0006-000000000006', 1850.00, '2026-03-15', 'lab-tests', 'health', NULL, NULL, '/uploads/receipt_6.jpg', 'HbA1c + lipid profile')
ON CONFLICT (id) DO NOTHING;