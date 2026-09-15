import { Router } from 'express';
import {
  handleGetMedicines,
  handleCreateMedicine,
} from './medicines.controller';

export const medicinesRouter = Router();

medicinesRouter.get('/', handleGetMedicines);
medicinesRouter.post('/', handleCreateMedicine);
