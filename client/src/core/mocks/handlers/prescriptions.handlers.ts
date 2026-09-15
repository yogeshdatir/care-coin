import { delay, http, HttpResponse } from 'msw';
import { dummyPrescriptions } from '../data/prescriptions.data';
import type {
  CreatePrescriptionRequestPayload,
  Prescription,
} from '@carecoin/shared-types';

export const prescriptionHandlers = [
  http.get('/api/prescriptions', async () => {
    const prescriptions = dummyPrescriptions;

    await delay(500);

    return HttpResponse.json({ data: prescriptions }, { status: 201 });
  }),

  http.post<never, CreatePrescriptionRequestPayload, Prescription>(
    '/api/prescription',
    async ({ request }) => {
      const data = await request.json();

      await delay(500);

      const prescriptionId = crypto.randomUUID();

      const savedPrescription = {
        id: prescriptionId,
        ...data,
      };

      return HttpResponse.json({ ...savedPrescription }, { status: 201 });
    },
  ),
];
