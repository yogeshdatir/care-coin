import type { CreateMedicineRequestPayload } from '@carecoin/shared-types';
import { API_BASE_URL } from './config';

export const createMedicine = async (payload: CreateMedicineRequestPayload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/medicines`, {
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

export const fetchMedicines = async ({ signal }: { signal: AbortSignal }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/medicines`, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

export async function createVariant(
  medicineId: string,
  payload: { form?: string; strength?: string },
) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/medicines/${medicineId}/variants`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
}
