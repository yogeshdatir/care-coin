import type {
  CreatePrescriptionRequestPayload,
  Prescription,
  UpdatePrescriptionRequestPayload,
} from '@carecoin/shared-types';
import { API_BASE_URL } from './config';

export const createPrescription = async (
  payload: CreatePrescriptionRequestPayload,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions`, {
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

export const fetchPrescriptions = async ({
  signal,
}: {
  signal: AbortSignal;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions`, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const updatePrescription = async (
  prescId: Prescription['id'],
  payload: UpdatePrescriptionRequestPayload,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/prescriptions/${prescId}`, {
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

export const deletePrescription = async (prescId: Prescription['id']) => {
  try {
    const url = new URL(`${API_BASE_URL}/prescriptions/${prescId}`);

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
  prescId: Prescription['id'],
): Promise<Prescription> {
  const response = await fetch(`${API_BASE_URL}/prescriptions/${prescId}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP error! Status: ${response.status}`);
  }
  return response.json();
}
