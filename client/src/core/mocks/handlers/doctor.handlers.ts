import { delay, http, HttpResponse } from 'msw';
import { dummyDoctors } from '../data/doctors.data';
import type { CreateDoctorRequestPayload, Doctor } from '@/shared/types';

export const doctorHandlers = [
  http.get('/api/doctors', async () => {
    const doctors = dummyDoctors;

    await delay(500);

    return HttpResponse.json({ data: doctors }, { status: 201 });
  }),

  http.post<never, CreateDoctorRequestPayload, Doctor>(
    '/api/doctor',
    async ({ request }) => {
      const data = await request.json();

      await delay(500);

      const { name, specialty, clinicName, city, phone, notes } = data;
      const doctorId = crypto.randomUUID();

      const savedDoctor = {
        id: doctorId,
        name,
        specialty,
        clinicName,
        city,
        phone,
        notes,
      };

      return HttpResponse.json({ ...savedDoctor }, { status: 201 });
    },
  ),
];
