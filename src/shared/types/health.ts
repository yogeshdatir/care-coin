export type CatalogItem = {
  id: string;
  name: string;
  type: string;
};

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
}

export interface MedicineVariant {
  id: string;
  medicineId: Medicine['id'];
  form?: MedicineForm;
  strength?: string;
}
