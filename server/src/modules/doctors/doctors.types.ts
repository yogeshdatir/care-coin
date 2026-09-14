export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  email: string;
}

export type CreateDoctorInput = Omit<Doctor, 'id'>;
