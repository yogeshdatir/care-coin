import type { Medicine } from '@carecoin/shared-types';

export const dummyMedicines: Medicine[] = [
  {
    id: 'med_1',
    name: 'Metformin',
    sideEffects: 'Mild nausea when taken without food.',
    variants: [
      { id: 'var_1', medicineId: 'med_1', form: 'tablet', strength: '500mg' },
      { id: 'var_2', medicineId: 'med_1', form: 'tablet', strength: '1000mg' },
    ],
  },
  {
    id: 'med_2',
    name: 'Atorvastatin',
    variants: [
      { id: 'var_3', medicineId: 'med_2', form: 'tablet', strength: '10mg' },
      { id: 'var_4', medicineId: 'med_2', form: 'tablet', strength: '20mg' },
    ],
  },
  {
    id: 'med_3',
    name: 'Amoxicillin',
    sideEffects: 'Allergic reaction — rash observed once in 2023.',
    variants: [
      { id: 'var_5', medicineId: 'med_3', form: 'capsule', strength: '250mg' },
      {
        id: 'var_6',
        medicineId: 'med_3',
        form: 'liquid-syrup',
        strength: '125mg/5ml',
      },
    ],
  },
  {
    id: 'med_4',
    name: 'Volini',
    variants: [
      { id: 'var_7', medicineId: 'med_4', form: 'topical' }, // strength unset — quick-created
    ],
  },
  {
    id: 'med_5',
    name: 'Crocin',
    variants: [
      { id: 'var_8', medicineId: 'med_5', form: 'tablet', strength: '650mg' },
    ],
  },
  {
    id: 'med_6',
    name: 'Ibuprofen',
    // no variants yet — freshly quick-created, nothing filled in
  },
];
