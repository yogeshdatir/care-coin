import type {
  CreateExpenseRequestPayload,
  Expense,
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
