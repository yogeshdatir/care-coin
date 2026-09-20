import { Router } from 'express';
import {
  handleGetMedicines,
  handleCreateMedicine,
  handleCreateVariant,
} from './medicines.controller';

export const medicinesRouter = Router();

medicinesRouter.get('/', handleGetMedicines);
medicinesRouter.post('/', handleCreateMedicine);
medicinesRouter.post('/:id/variants', handleCreateVariant);
