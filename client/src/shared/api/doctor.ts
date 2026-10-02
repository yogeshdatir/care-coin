import type {
  CreateDoctorRequestPayload,
  DeleteDoctorResponse,
  Doctor,
  UpdateDoctorRequestPayload,
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

export const deleteDoctor = async (
  id: Doctor['id'],
): Promise<DeleteDoctorResponse> => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP error! Status: ${response.status}`);
  }

  return response.json();
};

export async function fetchDoctorById(id: string): Promise<Doctor> {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export const updateDoctor = async (
  doctorId: Doctor['id'],
  payload: UpdateDoctorRequestPayload,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
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

export const unarchiveDoctor = async (id: Doctor['id']) => {
  const url = new URL(`${API_BASE_URL}/doctors/unarchive/${id}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP error! Status: ${response.status}`);
  }
};
