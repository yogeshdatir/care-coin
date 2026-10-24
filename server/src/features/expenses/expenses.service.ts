import type {
  CreateExpenseRequestPayload,
  Expense,
  ExpenseDomain,
} from '@carecoin/shared-types';
import { pool } from '../../db/pool';
import { emptyToNull } from '../../shared/utils';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FK_VIOLATION = '23503';

export const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

const notFound = () => httpError(404, 'Expense not found');

// to_char keeps DATE as 'YYYY-MM-DD' (pg would return a timezone-shifted JS Date)
const COLUMNS = `
  id, amount, to_char(date, 'YYYY-MM-DD') AS date, category, domain,
  linked_prescription_id, linked_medicine_variant_id, receipt_url, description, source, created_at`;

function mapRowToExpense(row: any): Expense {
  return {
    id: row.id,
    amount: Number(row.amount), // NUMERIC comes back from pg as a string
    date: row.date,
    category: row.category,
    domain: row.domain,
    linkedPrescriptionId: row.linked_prescription_id ?? undefined,
    linkedMedicineVariantId: row.linked_medicine_variant_id ?? undefined,
    receiptUrl: row.receipt_url ?? undefined,
    description: row.description ?? undefined,
    source: row.source,
    createdAt: row.created_at.toISOString(), // TIMESTAMPTZ comes back as a JS Date; JSON needs a string
  };
}

const toParams = (p: CreateExpenseRequestPayload) => [
  p.amount,
  p.date,
  p.category,
  p.domain,
  emptyToNull(p.linkedPrescriptionId),
  emptyToNull(p.linkedMedicineVariantId),
  emptyToNull(p.receiptUrl),
  emptyToNull(p.description),
];

/** A malformed UUID would make Postgres throw (500); treat it as "not found". */
function assertId(id: string) {
  if (!UUID_RE.test(id)) throw notFound();
}

/** Turns an FK violation (unknown linked prescription/variant) into a 400. */
async function withFkCheck<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err: any) {
    if (err.code === FK_VIOLATION) {
      throw httpError(
        400,
        'Linked prescription or medicine variant does not exist',
      );
    }
    throw err;
  }
}

export async function getAllExpenses(
  domain?: ExpenseDomain,
): Promise<Expense[]> {
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM expenses
     WHERE ($1::text IS NULL OR domain = $1)
     ORDER BY date DESC, created_at DESC`,
    [domain ?? null],
  );
  return result.rows.map(mapRowToExpense);
}

export async function getExpenseById(id: string): Promise<Expense> {
  assertId(id);
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM expenses WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) throw notFound();
  return mapRowToExpense(result.rows[0]);
}

/** source is not in the payload: it is server-owned and defaults to 'manual' in the DB. */
export async function createExpense(
  payload: CreateExpenseRequestPayload,
): Promise<Expense> {
  const result = await withFkCheck(() =>
    pool.query(
      `INSERT INTO expenses
         (amount, date, category, domain, linked_prescription_id, linked_medicine_variant_id, receipt_url, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${COLUMNS}`,
      toParams(payload),
    ),
  );
  return mapRowToExpense(result.rows[0]);
}

/** Full replace (PUT): optional fields not sent are cleared. source is never changed. */
export async function updateExpense(
  id: string,
  payload: CreateExpenseRequestPayload,
): Promise<Expense> {
  assertId(id);
  const result = await withFkCheck(() =>
    pool.query(
      `UPDATE expenses
       SET amount = $1, date = $2, category = $3, domain = $4,
           linked_prescription_id = $5, linked_medicine_variant_id = $6, receipt_url = $7,
           description = $8
       WHERE id = $9
       RETURNING ${COLUMNS}`,
      [...toParams(payload), id],
    ),
  );
  if (result.rows.length === 0) throw notFound();
  return mapRowToExpense(result.rows[0]);
}

/** Hard delete: nothing references expenses, so no soft-delete fallback is needed. */
export async function deleteExpense(id: string): Promise<void> {
  assertId(id);
  const result = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
  if (result.rowCount === 0) throw notFound();
}
