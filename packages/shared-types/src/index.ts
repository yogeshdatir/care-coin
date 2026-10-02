export interface MedicineFormItem {
  value: string;
  label: string;
}

export const MEDICINE_FORMS: MedicineFormItem[] = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'lozenge', label: 'Lozenge' },
  { value: 'liquid-syrup', label: 'Liquid / Syrup' },
  { value: 'topical', label: 'Cream / Ointment / Gel / Lotion' },
  { value: 'injection', label: 'Injection (IV/IM/SC)' },
  { value: 'inhaler-spray', label: 'Inhaler / Spray' },
  { value: 'eye-ear-drops', label: 'Eye / Ear Drops' },
  { value: 'suppository', label: 'Suppository' },
  { value: 'powder-granules', label: 'Powder / Granules' },
  { value: 'enema', label: 'Enema' },
] as const;

export type MedicineForm = (typeof MEDICINE_FORMS)[number]['value'];

export interface Medicine {
  id: string;
  name: string;
  sideEffects?: string;
  variants?: MedicineVariant[];
  isActive: boolean;
  archivedAt?: string;
}

export interface MedicineVariant {
  id: string;
  medicineId: Medicine['id'];
  form?: MedicineForm;
  strength?: string;
  isActive: boolean;
  archivedAt?: string;
}

export type CreateMedicineRequestPayload = Omit<
  Medicine,
  'id' | 'variants' | 'isActive' | 'archivedAt'
> & {
  variants?: Omit<
    MedicineVariant,
    'id' | 'medicineId' | 'isActive' | 'archivedAt'
  >[];
};

export type UpdateMedicineRequestPayload = Omit<
  Medicine,
  'id' | 'variants' | 'isActive' | 'archivedAt'
> & {
  variants?: (Omit<
    MedicineVariant,
    'id' | 'medicineId' | 'isActive' | 'archivedAt'
  > & {
    id?: MedicineVariant['id'];
    isActive?: MedicineVariant['isActive'];
  })[];
};

export type DeleteMedicineResponse = {
  archived: boolean; // true: soft-archived (in use), false: hard-deleted
};

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  clinicName?: string;
  city: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
  archivedAt?: string;
}

export type CreateDoctorRequestPayload = Omit<
  Doctor,
  'id' | 'isActive' | 'archivedAt'
>;

export type UpdateDoctorRequestPayload = Omit<
  Doctor,
  'id' | 'isActive' | 'archivedAt'
>;

export type DeleteDoctorResponse = {
  archived: boolean; // true: soft-archived (in use), false: hard-deleted
};

export interface PrescriptionMedicineFormRow {
  medicineId: Medicine['id'];
  medicineName?: string;
  medicineVariantId: MedicineVariant['id'];
  variantLabel?: string;
  frequency?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
}

export interface Prescription {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  notes?: string;
  imageUrl?: string;
  medicines?: PrescriptionMedicineFormRow[];
}

export type CreatePrescriptionRequestPayload = Omit<
  Prescription,
  'id' | 'doctorName'
>;

export type UpdatePrescriptionRequestPayload = Omit<
  Prescription,
  'id' | 'doctorName'
>;
