import { pool } from '../../db/pool';
import type {
  Prescription,
  PrescriptionMedicineFormRow,
  CreatePrescriptionRequestPayload,
} from '@carecoin/shared-types';
import { emptyToNull } from '../../shared/utils';

function mapMedicineRow(row: any): PrescriptionMedicineFormRow {
  return {
    medicineId: row.medicine_id, // joined from medicine_variants
    medicineVariantId: row.medicine_variant_id,
    frequency: row.frequency ?? undefined,
    reason: row.reason ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
  };
}

function mapPrescriptionRow(
  row: any,
  medicines: PrescriptionMedicineFormRow[],
): Prescription {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    date: row.date,
    notes: row.notes ?? undefined,
    imageUrl: row.image_url ?? undefined,
    medicines,
  };
}

export async function getAllPrescriptions(): Promise<Prescription[]> {
  const prescriptionsResult = await pool.query(
    'SELECT * FROM prescriptions ORDER BY date DESC',
  );

  const medicinesResult = await pool.query(`
    SELECT pm.*, mv.medicine_id
    FROM prescription_medicines pm
    JOIN medicine_variants mv ON mv.id = pm.medicine_variant_id
  `);

  const medicinesByPrescriptionId = new Map<
    string,
    PrescriptionMedicineFormRow[]
  >();
  for (const row of medicinesResult.rows) {
    const existing = medicinesByPrescriptionId.get(row.prescription_id) ?? [];
    existing.push(mapMedicineRow(row));
    medicinesByPrescriptionId.set(row.prescription_id, existing);
  }

  return prescriptionsResult.rows.map((row) =>
    mapPrescriptionRow(row, medicinesByPrescriptionId.get(row.id) ?? []),
  );
}

export async function createPrescription(
  payload: CreatePrescriptionRequestPayload,
): Promise<Prescription> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const prescriptionResult = await client.query(
      `INSERT INTO prescriptions (doctor_id, date, notes, image_url) VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        payload.doctorId,
        payload.date,
        emptyToNull(payload.notes),
        emptyToNull(payload.imageUrl),
      ],
    );
    const prescriptionRow = prescriptionResult.rows[0];

    const medicines: PrescriptionMedicineFormRow[] = [];
    for (const med of payload.medicines ?? []) {
      const result = await client.query(
        `INSERT INTO prescription_medicines (prescription_id, medicine_variant_id, frequency, reason, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          prescriptionRow.id,
          med.medicineVariantId,
          emptyToNull(med.frequency),
          emptyToNull(med.reason),
          emptyToNull(med.startDate),
          emptyToNull(med.endDate),
        ],
      );
      medicines.push(
        mapMedicineRow({ ...result.rows[0], medicine_id: med.medicineId }),
      );
    }

    await client.query('COMMIT');
    return mapPrescriptionRow(prescriptionRow, medicines);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
