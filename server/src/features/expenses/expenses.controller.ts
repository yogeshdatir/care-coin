import type { Request, Response } from 'express';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_DOMAINS,
  type CreateExpenseRequestPayload,
  type ExpenseCategory,
  type ExpenseDomain,
} from '@carecoin/shared-types';
import { requireStringParam } from '../../shared/utils';
import { normalizeDate } from './expenses.date';
import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  getExpenseById,
  httpError,
  updateExpense,
} from './expenses.service';

const MAX_DESCRIPTION_LENGTH = 200;

const isDomain = (value: unknown): value is ExpenseDomain =>
  EXPENSE_DOMAINS.includes(value as ExpenseDomain);

const CATEGORY_VALUES = EXPENSE_CATEGORIES.map((c) => c.value);

const isCategory = (value: unknown): value is ExpenseCategory =>
  CATEGORY_VALUES.includes(value as ExpenseCategory);

/** Validates the body shared by create (POST) and update (PUT). */
function parsePayload(body: any): CreateExpenseRequestPayload {
  const amount =
    typeof body?.amount === 'string' ? Number(body.amount) : body?.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw httpError(400, 'amount must be a number greater than 0');
  }

  // Accepts ISO or locale strings; always stored as YYYY-MM-DD.
  const date = normalizeDate(body?.date);
  if (!date)
    throw httpError(400, 'date is required (e.g. 2026-10-12 or 12/10/2026)');

  const category = body.category;
  if (!isCategory(category)) {
    throw httpError(
      400,
      `category must be one of: ${CATEGORY_VALUES.join(', ')}`,
    );
  }

  if (body.description != null && typeof body.description !== 'string') {
    throw httpError(400, 'description must be text');
  }
  const description = body.description?.trim();
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    throw httpError(
      400,
      `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
    );
  }

  const domain = body.domain ?? 'health'; // 'general' arrives in v2
  if (!isDomain(domain)) {
    throw httpError(
      400,
      `domain must be one of: ${EXPENSE_DOMAINS.join(', ')}`,
    );
  }

  return {
    amount,
    date,
    category,
    description,
    domain,
    linkedPrescriptionId: body.linkedPrescriptionId,
    linkedMedicineVariantId: body.linkedMedicineVariantId,
    receiptUrl: body.receiptUrl,
  };
}

/** Maps 400/404 to a response; anything else is rethrown (same as doctors). */
function respondOrThrow(res: Response, err: any) {
  if (err.status === 400 || err.status === 404) {
    return res.status(err.status).json({ message: err.message });
  }
  throw err;
}

export async function handleGetExpenses(req: Request, res: Response) {
  try {
    const { domain } = req.query;
    if (domain !== undefined && !isDomain(domain)) {
      throw httpError(
        400,
        `domain must be one of: ${EXPENSE_DOMAINS.join(', ')}`,
      );
    }
    res.status(200).json({ data: await getAllExpenses(domain) });
  } catch (err: any) {
    respondOrThrow(res, err);
  }
}

export async function handleGetExpenseById(req: Request, res: Response) {
  try {
    const id = requireStringParam(req.params.id, 'id');
    res.json(await getExpenseById(id));
  } catch (err: any) {
    respondOrThrow(res, err);
  }
}

export async function handleCreateExpense(req: Request, res: Response) {
  try {
    res.status(201).json(await createExpense(parsePayload(req.body)));
  } catch (err: any) {
    respondOrThrow(res, err);
  }
}

export async function handleUpdateExpense(req: Request, res: Response) {
  try {
    const id = requireStringParam(req.params.id, 'id');
    res.json(await updateExpense(id, parsePayload(req.body)));
  } catch (err: any) {
    respondOrThrow(res, err);
  }
}

export async function handleDeleteExpense(req: Request, res: Response) {
  try {
    const id = requireStringParam(req.params.id, 'id');
    await deleteExpense(id);
    res.status(204).send();
  } catch (err: any) {
    respondOrThrow(res, err);
  }
}
