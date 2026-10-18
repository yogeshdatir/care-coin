import type { Doctor, Prescription } from '@carecoin/shared-types';

const formatDate = (iso: string): string =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const getPrescriptionLabel = (
  prescription: Prescription,
  doctors: readonly Doctor[],
): string => {
  const doctor = doctors.find((d) => d.id === prescription.doctorId);
  return doctor
    ? `${formatDate(prescription.date)} · ${doctor.name}`
    : formatDate(prescription.date);
};
