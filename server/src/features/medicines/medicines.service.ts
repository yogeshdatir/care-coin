import { pool } from '../../db/pool';
import type {
  Medicine,
  MedicineVariant,
  CreateMedicineRequestPayload,
  UpdateMedicineRequestPayload,
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

export async function createVariant(
  medicineId: Medicine['id'],
  payload: Omit<MedicineVariant, 'id' | 'medicineId'>,
): Promise<MedicineVariant> {
  const result = await pool.query(
    `INSERT INTO medicine_variants (medicine_id, form, strength) VALUES ($1, $2, $3) RETURNING *`,
    [medicineId, emptyToNull(payload.form), emptyToNull(payload.strength)],
  );
  return mapVariantRow(result.rows[0]);
}

export async function updateMedicine(
  id: Medicine['id'],
  payload: UpdateMedicineRequestPayload,
): Promise<Medicine> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const medicineResult = await client.query(
      `UPDATE medicines SET name = $1, side_effects = $2 WHERE id = $3 RETURNING *`,
      [payload.name, emptyToNull(payload.sideEffects), id],
    );
    if (medicineResult.rows.length === 0) {
      throw Object.assign(new Error('Medicine not found'), { status: 404 });
    }

    const submittedVariants = payload.variants ?? [];
    const submittedIds = submittedVariants.filter((v) => v.id).map((v) => v.id);

    // Delete variants no longer present
    await client.query(
      `DELETE FROM medicine_variants WHERE medicine_id = $1 AND id != ALL($2::uuid[])`,
      [
        id,
        submittedIds.length > 0
          ? submittedIds
          : ['00000000-0000-0000-0000-000000000000'],
      ],
    );

    const resultVariants: MedicineVariant[] = [];
    for (const variant of submittedVariants) {
      if (variant.id) {
        const updated = await client.query(
          `UPDATE medicine_variants SET form = $1, strength = $2 WHERE id = $3 RETURNING *`,
          [
            emptyToNull(variant.form),
            emptyToNull(variant.strength),
            variant.id,
          ],
        );
        resultVariants.push(mapVariantRow(updated.rows[0]));
      } else {
        const created = await client.query(
          `INSERT INTO medicine_variants (medicine_id, form, strength) VALUES ($1, $2, $3) RETURNING *`,
          [id, emptyToNull(variant.form), emptyToNull(variant.strength)],
        );
        resultVariants.push(mapVariantRow(created.rows[0]));
      }
    }

    await client.query('COMMIT');
    return mapMedicineRow(medicineResult.rows[0], resultVariants);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
