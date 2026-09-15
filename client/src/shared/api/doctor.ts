import type { CreateDoctorRequestPayload } from '@shared/types';

export const createDoctor = async (payload: CreateDoctorRequestPayload) => {
  try {
    const response = await fetch('/api/doctor', {
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

export const fetchDoctors = async ({ signal }: { signal: AbortSignal }) => {
  try {
    const response = await fetch('/api/doctors', { signal });
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
