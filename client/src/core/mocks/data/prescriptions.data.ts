import type { Prescription } from '@carecoin/shared-types';

export const dummyPrescriptions: Prescription[] = [
  {
    id: 'presc_1',
    doctorId: 'doc_1',
    date: '2026-01-05',
    notes: 'Routine diabetes checkup.',
    medicines: [
      {
        medicineId: 'med_1',
        medicineVariantId: 'var_1',
        frequency: '2x daily',
        reason: 'Diabetes management',
        startDate: '2026-01-05',
      },
      {
        medicineId: 'med_2',
        medicineVariantId: 'var_3',
        frequency: '1x nightly',
        reason: 'Cholesterol control',
        startDate: '2026-01-05',
      },
    ],
  },
  {
    id: 'presc_2',
    doctorId: 'doc_2',
    date: '2026-02-10',
    notes: 'Follow-up for lower back pain.',
    imageUrl: '/uploads/presc_2.jpg',
    medicines: [
      {
        medicineId: 'med_5',
        medicineVariantId: 'var_8',
        frequency: 'As needed',
        reason: 'Back pain',
        startDate: '2026-02-10',
        endDate: '2026-02-20',
      },
      {
        medicineId: 'med_4',
        medicineVariantId: 'var_7',
        frequency: '2x daily, apply on affected area',
        reason: 'Back pain',
        startDate: '2026-02-10',
        endDate: '2026-02-20',
      },
    ],
  },
  {
    id: 'presc_3',
    doctorId: 'doc_3',
    date: '2026-03-02',
    medicines: [
      {
        medicineId: 'med_3',
        medicineVariantId: 'var_5',
        frequency: '3x daily after meals',
        reason: 'Throat infection',
        startDate: '2026-03-02',
        endDate: '2026-03-09',
      },
    ],
  },
  {
    id: 'presc_4',
    doctorId: 'doc_4',
    date: '2026-03-20',
    notes: 'General consultation, no prescription needed yet.',
    // no medicines — freshly created prescription, medicines not added yet
  },
];
