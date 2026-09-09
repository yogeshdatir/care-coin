import type { CreatePrescriptionRequestPayload } from '../types';

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
