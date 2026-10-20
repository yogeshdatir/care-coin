import {
  EXPENSE_CATEGORIES,
  MEDICINE_FORMS,
  type CreateExpenseRequestPayload,
  type Doctor,
  type Expense,
  type ExpenseCategory,
  type Medicine,
  type MedicineVariant,
  type Prescription,
} from '@carecoin/shared-types';

/**
 * What the form holds. Separate from the API payload on purpose:
 * - every input value is a string ('' = not set), so inputs stay controlled
 * - `medicineId` exists only to filter the variant options and is never sent
 */
export interface ExpenseFormValues {
  date: Date | undefined;
  category: ExpenseCategory | ''; // '' until the user picks one
  amount: string;
  description: string;
  linkedPrescriptionId: string;
  medicineId: string; // UI-only
  linkedMedicineVariantId: string;
  receiptUrl: string;
}

export const EMPTY_EXPENSE_FORM: ExpenseFormValues = {
  date: new Date(),
  category: '',
  amount: '',
  description: '',
  linkedPrescriptionId: '',
  medicineId: '',
  linkedMedicineVariantId: '',
  receiptUrl: '',
};

const isExpenseCategory = (value: unknown): value is ExpenseCategory =>
  EXPENSE_CATEGORIES.some((category) => category.value === value);

const emptyToUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

/** Form values -> API payload. Lists every field explicitly, so UI-only fields cannot leak. */
export function toExpensePayload(
  values: ExpenseFormValues,
): CreateExpenseRequestPayload {
  const { category } = values;
  if (!isExpenseCategory(category)) throw new Error('Category is required');

  return {
    amount: Number(values.amount),
    date: values.date ? values.date.toISOString() : '',
    category,
    description: emptyToUndefined(values.description),
    domain: 'health', // 'general' arrives in v2
    linkedPrescriptionId: emptyToUndefined(values.linkedPrescriptionId),
    // a stale variant must not be sent after the category changed away from medicines
    linkedMedicineVariantId:
      category === 'medicines'
        ? emptyToUndefined(values.linkedMedicineVariantId)
        : undefined,
    receiptUrl: emptyToUndefined(values.receiptUrl),
  };
}

/** Saved expense -> form values for editing. The medicine is derived from the variant. */
export function toExpenseFormValues(
  expense: Expense,
  medicines: Medicine[],
): ExpenseFormValues {
  const variantId = expense.linkedMedicineVariantId;
  const medicine = variantId
    ? medicines.find((m) => m.variants?.some((v) => v.id === variantId))
    : undefined;

  return {
    date: expense?.date ? new Date(expense?.date) : undefined,
    category: expense.category,
    amount: String(expense.amount),
    description: expense.description ?? '',
    linkedPrescriptionId: expense.linkedPrescriptionId ?? '',
    medicineId: medicine?.id ?? '',
    linkedMedicineVariantId: variantId ?? '',
    receiptUrl: expense.receiptUrl ?? '',
  };
}

const formatDate = (iso: string): string =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const getPrescriptionLabel = (
  prescription: Prescription,
  doctors: readonly Doctor[],
): string => {
  const doctor = doctors.find((d) => d.id === prescription.doctorId);
  return doctor
    ? `${formatDate(prescription.date)} · ${doctor.name}`
    : formatDate(prescription.date);
};

export const getPrescriptionLabelFromPrescId = (
  prescriptionId: Prescription['id'] | undefined,
  prescriptions: Prescription[],
  doctors: readonly Doctor[],
) => {
  if (!prescriptionId) return '';
  const currPresc = prescriptions.find((presc) => presc.id === prescriptionId);
  if (currPresc) return getPrescriptionLabel(currPresc, doctors);
};

export const getTotalOfExpenses = (expenses: Expense[]) => {
  return expenses.reduce((acc, expense) => {
    return acc + expense.amount;
  }, 0);
};

/** "Tablet - 500mg" — same format the variant field asks for. */
export const getVariantLabel = ({
  form,
  strength,
}: MedicineVariant): string => {
  const formLabel = MEDICINE_FORMS.find((f) => f.value === form)?.label;
  return [formLabel, strength].filter(Boolean).join(' - ');
};

export const getCategoryLabel = (category: Expense['category']): string =>
  EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? category;

/** Display name for an expense row. */
export const getExpenseItemLabel = (
  expense: Expense,
  medicines: readonly Medicine[],
): string => {
  const { category, description, linkedMedicineVariantId } = expense;

  if (category === 'medicines' && linkedMedicineVariantId) {
    for (const medicine of medicines) {
      const variant = medicine.variants?.find(
        (v) => v.id === linkedMedicineVariantId,
      );
      if (variant) {
        const variantLabel = getVariantLabel(variant);
        return variantLabel
          ? `${medicine.name} · ${variantLabel}`
          : medicine.name;
      }
    }
  }

  return description?.trim() || getCategoryLabel(category);
};

/** Newest first. Equal dates keep their existing order (Array.sort is stable). */
export const sortExpenses = (expenses: readonly Expense[]): Expense[] =>
  [...expenses].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );

/** The variant to pre-select: only when exactly one active variant exists. */
export const getDefaultVariantId = (medicine: Medicine): string => {
  const active = medicine.variants?.filter((v) => v.isActive) ?? [];
  return active.length === 1 ? active[0].id : '';
};

export const toAddAnotherValues = (
  values: ExpenseFormValues,
): ExpenseFormValues => ({
  ...EMPTY_EXPENSE_FORM,
  date: values.date,
  category: values.category,
  linkedPrescriptionId: values.linkedPrescriptionId,
  receiptUrl: values.receiptUrl,
});

/** A past expense as a fresh draft: today's date, no receipt (it's a new purchase). */
export const toDuplicateValues = (
  expense: Expense,
  medicines: Medicine[],
): ExpenseFormValues => ({
  ...toExpenseFormValues(expense, medicines),
  date: new Date(),
  receiptUrl: '',
});

/** Past descriptions for a category, most used first, case-insensitive duplicates merged. */
export const getDescriptionSuggestions = (
  expenses: readonly Expense[],
  category: ExpenseCategory | '',
  limit = 10,
): string[] => {
  const counts = new Map<string, { text: string; count: number }>();

  for (const expense of expenses) {
    const text = expense.description?.trim();
    if (!text || (category && expense.category !== category)) continue;
    const key = text.toLowerCase();
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { text, count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, limit)
    .map((entry) => entry.text);
};
