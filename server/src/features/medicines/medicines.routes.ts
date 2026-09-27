import { Router } from 'express';
import {
  handleGetMedicines,
  handleCreateMedicine,
  handleCreateVariant,
  handleUpdateMedicine,
  handleDeleteMedicine,
} from './medicines.controller';

export const medicinesRouter = Router();

medicinesRouter.get('/', handleGetMedicines);
medicinesRouter.post('/', handleCreateMedicine);
medicinesRouter.post('/:id/variants', handleCreateVariant);
medicinesRouter.put('/:id', handleUpdateMedicine);
medicinesRouter.delete('/:id', handleDeleteMedicine);
