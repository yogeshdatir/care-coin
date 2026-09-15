export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  clinicName?: string;
  city: string;
  phone?: string;
  notes?: string;
}

export type CreateDoctorRequestPayload = Omit<Doctor, 'id'>;
