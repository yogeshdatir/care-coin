import type { CreatePrescriptionRequestPayload } from '@carecoin/shared-types';

export const createPrescription = async (
  data: CreatePrescriptionRequestPayload,
) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const prescriptionId = crypto.randomUUID();

  const savedPrescription = {
    id: prescriptionId,
    ...data,
  };

  return savedPrescription;
};

export const fetchPrescriptions = async ({
  signal,
}: {
  signal: AbortSignal;
}) => {
  try {
    const response = await fetch('/api/prescriptions', { signal });
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
