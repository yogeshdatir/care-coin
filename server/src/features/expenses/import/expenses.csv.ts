import { parseString } from 'fast-csv';
import {
  EXPENSE_CATEGORIES,
  MEDICINE_FORMS,
  type ExpenseCategory,
} from '@carecoin/shared-types';
import { normalizeDate } from '../expenses.date';

export const DEFAULT_VARIANT_FORM = 'tablet';
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_ROWS = 1000;

export interface ImportMedicine {
  name: string;
  form: string; // always set (defaults to tablet)
  strength?: string | undefined;
}

export interface ImportRow {
  line: number; // line in the CSV file (header = 1)
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  description?: string | undefined;
  receiptUrl?: string | undefined;
  medicine?: ImportMedicine; // only for category = medicines
}

export interface RowError {
  line: number;
  message: string;
}

export interface ParsedCsv {
  rows: ImportRow[];
  errors: RowError[];
}

/** "Receipt URL" -> "receipturl", so header spelling and case do not matter. */
const normalizeHeader = (h: string) =>
  h.toLowerCase().replace(/[^a-z0-9]/g, '');

const clean = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s === '' ? undefined : s;
};

const matchOption = (
  options: readonly { value: string; label: string }[],
  input: string,
) => {
  const needle = input.toLowerCase();
  return options.find(
    (o) => o.value.toLowerCase() === needle || o.label.toLowerCase() === needle,
  )?.value;
};

/** Accepts "₹1,850.50", "1850.5". Returns NaN when unusable. */
const parseAmount = (input: string | undefined): number =>
  input ? Number(input.replace(/[^0-9.]/g, '')) : NaN;

function parseRow(
  raw: Record<string, string>,
  line: number,
): ImportRow | string {
  const date = normalizeDate(raw.date);
  if (!date) return 'date is missing or invalid (use YYYY-MM-DD or DD/MM/YYYY)';

  const categoryText = clean(raw.category);
  const category =
    categoryText &&
    (matchOption(EXPENSE_CATEGORIES, categoryText) as
      | ExpenseCategory
      | undefined);
  if (!category) {
    return `category must be one of: ${EXPENSE_CATEGORIES.map((c) => c.value).join(', ')}`;
  }

  const amount = parseAmount(clean(raw.amount));
  if (!Number.isFinite(amount) || amount <= 0)
    return 'amount must be a number greater than 0';

  const description = clean(raw.description);
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
  }

  const row: ImportRow = {
    line,
    date,
    category,
    amount,
    description,
    receiptUrl: clean(raw.receipturl),
  };

  if (category === 'medicines') {
    const name = clean(raw.medicine);
    if (!name) return 'medicine is required when category is medicines';

    const formText = clean(raw.form);
    const form = formText
      ? matchOption(MEDICINE_FORMS, formText)
      : DEFAULT_VARIANT_FORM;
    if (!form)
      return `form must be one of: ${MEDICINE_FORMS.map((f) => f.value).join(', ')}`;

    row.medicine = { name, form, strength: clean(raw.strength) };
  }
  return row;
}

type Record_ = Record<string, string>;

/** fast-csv is stream-based, so wrap it in a promise. Headers are normalized on the way in. */
function readRecords(text: string): Promise<Record_[]> {
  return new Promise((resolve, reject) => {
    const records: Record_[] = [];
    parseString<Record_, Record_>(text.replace(/^﻿/, ''), {
      headers: (headers) => headers.map((h) => normalizeHeader(h ?? '')),
      ignoreEmpty: true,
      trim: true,
    })
      .on('error', reject)
      .on('data', (row: Record_) => records.push(row))
      .on('end', () => resolve(records));
  });
}

/** CSV text in, valid rows and per-line errors out. No DB access. */
export async function parseExpensesCsv(text: string): Promise<ParsedCsv> {
  let records: Record_[];
  try {
    records = await readRecords(text);
  } catch (err: any) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Invalid CSV: ${err.message}` }],
    };
  }

  if (records.length === 0)
    return { rows: [], errors: [{ line: 1, message: 'CSV has no data rows' }] };
  if (records.length > MAX_ROWS) {
    return {
      rows: [],
      errors: [{ line: 1, message: `At most ${MAX_ROWS} rows per import` }],
    };
  }

  const rows: ImportRow[] = [];
  const errors: RowError[] = [];
  records.forEach((record, i) => {
    const line = i + 2; // +1 for the header, +1 for 1-based
    const result = parseRow(record, line);
    if (typeof result === 'string') errors.push({ line, message: result });
    else rows.push(result);
  });
  return { rows, errors };
}
