import type {
  Doctor,
  CreateDoctorRequestPayload,
} from '@carecoin/shared-types';
import { pool } from '../../db/pool';

function mapRowToDoctor(row: any): Doctor {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty ?? undefined,
    clinicName: row.clinic_name ?? undefined,
    city: row.city,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function getAllDoctors(): Promise<Doctor[]> {
  const result = await pool.query('SELECT * FROM doctors ORDER BY name');
  return result.rows.map(mapRowToDoctor);
}

export async function createDoctor(
  payload: CreateDoctorRequestPayload,
): Promise<Doctor> {
  const result = await pool.query(
    `INSERT INTO doctors (name, specialty, clinic_name, city, phone, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      payload.name,
      payload.specialty ?? null,
      payload.clinicName ?? null,
      payload.city,
      payload.phone ?? null,
      payload.notes ?? null,
    ],
  );
  return mapRowToDoctor(result.rows[0]);
}
