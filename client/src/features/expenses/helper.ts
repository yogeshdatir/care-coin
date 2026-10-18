import {
  EXPENSE_CATEGORIES,
  type CreateExpenseRequestPayload,
  type Doctor,
  type Expense,
  type ExpenseCategory,
  type Medicine,
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
  date: undefined,
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
    date: values.date ? values.date.toISOString() : null,
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
