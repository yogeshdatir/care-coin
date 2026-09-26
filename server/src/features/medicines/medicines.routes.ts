import { Router } from 'express';
import {
  handleGetMedicines,
  handleCreateMedicine,
  handleCreateVariant,
  handleUpdateMedicine,
} from './medicines.controller';

export const medicinesRouter = Router();

medicinesRouter.get('/', handleGetMedicines);
medicinesRouter.post('/', handleCreateMedicine);
medicinesRouter.post('/:id/variants', handleCreateVariant);
medicinesRouter.put('/:id', handleUpdateMedicine);
