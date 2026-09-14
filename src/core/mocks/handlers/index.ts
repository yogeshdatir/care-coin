import { doctorHandlers } from './doctor.handlers';
import { medicineHandlers } from './medicines.handlers';

export const handlers = [...doctorHandlers, ...medicineHandlers];
