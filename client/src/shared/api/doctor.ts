import type {
  CreateDoctorRequestPayload,
  Doctor,
} from '@carecoin/shared-types';
import { API_BASE_URL } from './config';

export const createDoctor = async (payload: CreateDoctorRequestPayload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors`, {
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

export const fetchDoctors = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<{ data: Doctor[] } | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors`, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

export const deleteDoctor = async (id: Doctor['id']) => {
  try {
    const url = new URL(`${API_BASE_URL}/doctors/${id}`);

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
