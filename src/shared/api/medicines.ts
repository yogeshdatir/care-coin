import type { CreateMedicineRequestPayload } from '../types';

export const createMedicine = async (data: CreateMedicineRequestPayload) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const medicineId = crypto.randomUUID();

  const savedMedicine = {
    id: medicineId,
    name: data.name,
    sideEffects: data.sideEffects,
    variants: (data?.variants ?? []).map((medicineVariant) => ({
      ...medicineVariant,
      id: crypto.randomUUID(),
      medicineId,
    })),
  };

  return savedMedicine;
};
