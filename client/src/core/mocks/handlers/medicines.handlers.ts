import { delay, http, HttpResponse } from 'msw';
import { dummyMedicines } from '../data/medicines.data';
import type { CreateMedicineRequestPayload, Medicine } from '@shared/types';

export const medicineHandlers = [
  http.get('/api/medicines', async () => {
    const medicines = dummyMedicines;

    await delay(500);

    return HttpResponse.json({ data: medicines }, { status: 201 });
  }),

  http.post<never, CreateMedicineRequestPayload, Medicine>(
    '/api/medicine',
    async ({ request }) => {
      const data = await request.json();

      await delay(500);

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

      return HttpResponse.json({ ...savedMedicine }, { status: 201 });
    },
  ),
];
