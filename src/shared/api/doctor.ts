import type { CreateDoctorRequestPayload, Doctor } from '../types';

export const createDoctor = async (data: CreateDoctorRequestPayload) => {
  const { name, specialty, clinicName, city, phone, notes } = data;
  await new Promise((resolve) => setTimeout(resolve, 300));

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

  return savedDoctor;
};

export const fetchDoctors = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const doctors: Doctor[] = [
    {
      id: '0',
      name: 'test',
      city: 'pune',
    },
  ];

  return doctors;
};
