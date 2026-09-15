import { pool } from '../../db/pool';
import type {
  Medicine,
  MedicineVariant,
  CreateMedicineRequestPayload,
} from '@carecoin/shared-types';
import { emptyToNull } from '../../shared/utils';

function mapVariantRow(row: any): MedicineVariant {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    form: row.form ?? undefined,
    strength: row.strength ?? undefined,
  };
}

function mapMedicineRow(row: any, variants: MedicineVariant[]): Medicine {
  return {
    id: row.id,
    name: row.name,
    sideEffects: row.side_effects ?? undefined,
    variants,
  };
}

export async function getAllMedicines(): Promise<Medicine[]> {
  const medicinesResult = await pool.query(
    'SELECT * FROM medicines ORDER BY name',
  );
  const variantsResult = await pool.query('SELECT * FROM medicine_variants');

  const variantsByMedicineId = new Map<string, MedicineVariant[]>();
  for (const row of variantsResult.rows) {
    const variant = mapVariantRow(row);
    const existing = variantsByMedicineId.get(variant.medicineId) ?? [];
    existing.push(variant);
    variantsByMedicineId.set(variant.medicineId, existing);
  }

  return medicinesResult.rows.map((row) =>
    mapMedicineRow(row, variantsByMedicineId.get(row.id) ?? []),
  );
}

export async function createMedicine(
  payload: CreateMedicineRequestPayload,
): Promise<Medicine> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const medicineResult = await client.query(
      `INSERT INTO medicines (name, side_effects) VALUES ($1, $2) RETURNING *`,
      [payload.name, emptyToNull(payload.sideEffects)],
    );
    const medicineRow = medicineResult.rows[0];

    const variants: MedicineVariant[] = [];
    for (const variant of payload.variants ?? []) {
      const variantResult = await client.query(
        `INSERT INTO medicine_variants (medicine_id, form, strength) VALUES ($1, $2, $3) RETURNING *`,
        [
          medicineRow.id,
          emptyToNull(variant.form),
          emptyToNull(variant.strength),
        ],
      );
      variants.push(mapVariantRow(variantResult.rows[0]));
    }

    await client.query('COMMIT');
    return mapMedicineRow(medicineRow, variants);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
