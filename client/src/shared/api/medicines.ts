import type { CreateMedicineRequestPayload } from '@shared/types';

export const createMedicine = async (payload: CreateMedicineRequestPayload) => {
  try {
    const response = await fetch('/api/medicine', {
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
    console.log('Success:', data);

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const fetchMedicines = async ({ signal }: { signal: AbortSignal }) => {
  try {
    const response = await fetch('/api/medicines', { signal });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Success:', data);

    return data;
  } catch (error) {
    console.error(error);
  }
};
