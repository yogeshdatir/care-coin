import type { Doctor } from '@carecoin/shared-types';

export const dummyDoctors: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. Ananya Shah',
    specialty: 'General Physician',
    clinicName: 'CityCare Clinic',
    city: 'Pune',
    phone: '+91 98765 43210',
  },
  {
    id: 'doc_2',
    name: 'Dr. Rohan Mehta',
    specialty: 'Orthopedic',
    clinicName: 'Bone & Joint Center',
    city: 'Bangalore',
    phone: '+91 98123 45678',
    notes: 'Prefers evening appointments; follow-up every 3 months.',
  },
  {
    id: 'doc_3',
    name: 'Dr. Priya Nair',
    specialty: 'Dermatologist',
    clinicName: 'Skin & Glow Clinic',
    city: 'Mumbai',
  },
  {
    id: 'doc_4',
    name: 'Dr. Arjun Verma',
    city: 'Pune',
    phone: '+91 90000 11223',
  },
  {
    id: 'doc_5',
    name: 'Dr. Kavita Reddy',
    specialty: 'Gynecologist',
    clinicName: "Women's Wellness Center",
    city: 'Bangalore',
    notes: 'Referred by Dr. Ananya Shah.',
  },
];
