import type {
  Doctor,
  CreateDoctorRequestPayload,
} from '@carecoin/shared-types';
import { pool } from '../../db/pool';
import { emptyToNull } from '../../shared/utils';

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
      emptyToNull(payload.specialty),
      emptyToNull(payload.clinicName),
      payload.city,
      emptyToNull(payload.phone),
      emptyToNull(payload.notes),
    ],
  );
  return mapRowToDoctor(result.rows[0]);
}

export async function deleteDoctor(id: string): Promise<void> {
  const result = await pool.query('DELETE FROM doctors WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    const error = new Error('Doctor not found');
    (error as any).status = 404;
    throw error;
  }
}

export async function updateDoctor(
  id: string,
  payload: CreateDoctorRequestPayload,
): Promise<Doctor> {
  const result = await pool.query(
    `UPDATE doctors
     SET name = $1, specialty = $2, clinic_name = $3, city = $4, phone = $5, notes = $6
     WHERE id = $7
     RETURNING *`,
    [
      payload.name,
      emptyToNull(payload.specialty),
      emptyToNull(payload.clinicName),
      payload.city,
      emptyToNull(payload.phone),
      emptyToNull(payload.notes),
      id,
    ],
  );

  if (result.rows.length === 0) {
    const error = new Error('Doctor not found');
    (error as any).status = 404;
    throw error;
  }

  return mapRowToDoctor(result.rows[0]);
}
