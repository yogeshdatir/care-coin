import type { PoolClient } from 'pg';
import type { ImportMedicine, ImportRow } from './expenses.csv';
import { emptyToNull } from '../../../shared/utils';
import { pool } from '../../../db/pool';

export interface ImportSummary {
  expensesCreated: number;
  medicinesCreated: number;
  variantsCreated: number;
}

/** Finds or creates medicines and variants, remembering ids within one import. */
function createCatalogResolver(db: PoolClient, summary: ImportSummary) {
  const medicineIds = new Map<string, string>(); // lower(name) -> id
  const variantIds = new Map<string, string>(); // medicineId|form|lower(strength) -> id

  async function medicineId(name: string): Promise<string> {
    const key = name.toLowerCase();
    const cached = medicineIds.get(key);
    if (cached) return cached;

    const found = await db.query(
      'SELECT id FROM medicines WHERE lower(name) = $1 LIMIT 1',
      [key],
    );
    let id: string = found.rows[0]?.id;
    if (!id) {
      const created = await db.query(
        'INSERT INTO medicines (name) VALUES ($1) RETURNING id',
        [name],
      );
      id = created.rows[0].id;
      summary.medicinesCreated++;
    }
    medicineIds.set(key, id);
    return id;
  }

  async function variantId({
    name,
    form,
    strength,
  }: ImportMedicine): Promise<string> {
    const medId = await medicineId(name);
    const key = `${medId}|${form}|${(strength ?? '').toLowerCase()}`;
    const cached = variantIds.get(key);
    if (cached) return cached;

    const found = await db.query(
      `SELECT id FROM medicine_variants
       WHERE medicine_id = $1 AND form = $2 AND lower(strength) IS NOT DISTINCT FROM $3
       LIMIT 1`,
      [medId, form, strength?.toLowerCase() ?? null],
    );
    let id: string = found.rows[0]?.id;
    if (!id) {
      const created = await db.query(
        'INSERT INTO medicine_variants (medicine_id, form, strength) VALUES ($1, $2, $3) RETURNING id',
        [medId, form, emptyToNull(strength)],
      );
      id = created.rows[0].id;
      summary.variantsCreated++;
    }
    variantIds.set(key, id);
    return id;
  }

  return { variantId };
}

/** All-or-nothing: one transaction, so a failure leaves no medicines or expenses behind. */
export async function importExpenses(
  rows: ImportRow[],
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    expensesCreated: 0,
    medicinesCreated: 0,
    variantsCreated: 0,
  };
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const catalog = createCatalogResolver(db, summary);

    for (const row of rows) {
      const variantId = row.medicine
        ? await catalog.variantId(row.medicine)
        : null;
      await db.query(
        `INSERT INTO expenses
           (amount, date, category, domain, linked_medicine_variant_id, receipt_url, description, source)
         VALUES ($1, $2, $3, 'health', $4, $5, $6, 'import')`,
        [
          row.amount,
          row.date,
          row.category,
          variantId,
          emptyToNull(row.receiptUrl),
          emptyToNull(row.description),
        ],
      );
      summary.expensesCreated++;
    }

    await db.query('COMMIT');
    return summary;
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  } finally {
    db.release();
  }
}
