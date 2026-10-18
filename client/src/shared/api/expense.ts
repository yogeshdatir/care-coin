import type {
  CreateExpenseRequestPayload,
  Expense,
  UpdateExpenseRequestPayload,
} from '@carecoin/shared-types';
import { API_BASE_URL } from './config';

export const fetchExpenses = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<{ data: Expense[] } | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses`, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const createExpense = async (payload: CreateExpenseRequestPayload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const updateExpense = async (
  expenseId: Expense['id'],
  payload: UpdateExpenseRequestPayload,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const deletePrescription = async (expenseId: Expense['id']) => {
  try {
    const url = new URL(`${API_BASE_URL}/expenses/${expenseId}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error(error);
  }
};

export async function fetchPrescriptionById(
  expenseId: Expense['id'],
): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP error! Status: ${response.status}`);
  }
  return response.json();
}
