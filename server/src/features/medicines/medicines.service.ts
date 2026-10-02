import { pool } from '../../db/pool';
import type {
  Medicine,
  MedicineVariant,
  CreateMedicineRequestPayload,
  UpdateMedicineRequestPayload,
  DeleteMedicineResponse,
} from '@carecoin/shared-types';
import { emptyToNull } from '../../shared/utils';

function mapVariantRow(row: any): MedicineVariant {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    form: row.form ?? undefined,
    strength: row.strength ?? undefined,
    isActive: row.is_active,
    archivedAt: row.archived_at ?? undefined,
  };
}

function mapMedicineRow(row: any, variants: MedicineVariant[]): Medicine {
  return {
    id: row.id,
    name: row.name,
    sideEffects: row.side_effects ?? undefined,
    variants,
    isActive: row.is_active,
    archivedAt: row.archived_at ?? undefined,
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

    // Find variants that were removed from the submitted array
    const existingVariantsResult = await client.query(
      `SELECT id FROM medicine_variants WHERE medicine_id = $1 AND is_active = true`,
      [id],
    );
    const removedIds = existingVariantsResult.rows
      .map((r) => r.id)
      .filter((existingId) => !submittedIds.includes(existingId));

    for (const removedId of removedIds) {
      await client.query('SAVEPOINT before_variant_delete');
      try {
        await client.query(`DELETE FROM medicine_variants WHERE id = $1`, [
          removedId,
        ]);
      } catch (err: any) {
        if (err.code === '23503') {
          // In use by a prescription — roll back the failed delete, then soft-delete instead
          await client.query('ROLLBACK TO SAVEPOINT before_variant_delete');
          await client.query(
            `UPDATE medicine_variants SET is_active = false, archived_at = now() WHERE id = $1`,
            [removedId],
          );
        } else {
          throw err;
        }
      }
    }

    const resultVariants: MedicineVariant[] = [];
    for (const variant of submittedVariants) {
      if (variant.id) {
        const updated = await client.query(
          `UPDATE medicine_variants SET form = $1, strength = $2, is_active = $3 WHERE id = $4 RETURNING *`,
          [
            emptyToNull(variant.form),
            emptyToNull(variant.strength),
            variant.isActive,
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

export async function deleteMedicine(
  id: Medicine['id'],
): Promise<DeleteMedicineResponse> {
  const client = await pool.connect();
  let archived = false;

  try {
    await client.query('BEGIN');
    await client.query('SAVEPOINT before_delete');

    try {
      const result = await client.query('DELETE FROM medicines WHERE id = $1', [
        id,
      ]);
      if (result.rowCount === 0) {
        throw Object.assign(new Error('Medicine not found'), { status: 404 });
      }
    } catch (err: any) {
      if (err.code !== '23503') throw err;

      await client.query('ROLLBACK TO SAVEPOINT before_delete');
      await client.query(
        `UPDATE medicine_variants SET is_active = false, archived_at = now() WHERE medicine_id = $1`,
        [id],
      );
      await client.query(
        `UPDATE medicines SET is_active = false, archived_at = now() WHERE id = $1`,
        [id],
      );
      archived = true;
    }

    await client.query('COMMIT');
    return { archived };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function unarchiveMedicine(id: Medicine['id']): Promise<Medicine> {
  const result = await pool.query(
    `UPDATE medicines SET is_active = true WHERE id = $1 RETURNING *`,
    [id],
  );

  if (result.rows.length === 0) {
    const error = new Error('Medicine not found');
    (error as any).status = 404;
    throw error;
  }

  return mapMedicineRow(result.rows[0], []);
}

export async function unarchiveVariant(
  id: MedicineVariant['id'],
): Promise<MedicineVariant> {
  const result = await pool.query(
    `UPDATE medicine_variants SET is_active = true WHERE id = $1 RETURNING *`,
    [id],
  );

  if (result.rows.length === 0) {
    const error = new Error('Medicine variant not found');
    (error as any).status = 404;
    throw error;
  }

  return mapVariantRow(result.rows[0]);
}
