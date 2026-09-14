import { doctorHandlers } from './doctor.handlers';
import { medicineHandlers } from './medicines.handlers';
import { prescriptionHandlers } from './prescriptions.handlers';

export const handlers = [
  ...doctorHandlers,
  ...medicineHandlers,
  ...prescriptionHandlers,
];
