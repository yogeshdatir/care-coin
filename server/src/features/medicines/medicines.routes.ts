import { Router } from 'express';
import {
  handleGetMedicines,
  handleCreateMedicine,
  handleCreateVariant,
  handleUpdateMedicine,
  handleDeleteMedicine,
  handleUnarchiveMedicine,
  handleUnarchiveVariant,
} from './medicines.controller';

export const medicinesRouter = Router();

medicinesRouter.get('/', handleGetMedicines);
medicinesRouter.post('/', handleCreateMedicine);
medicinesRouter.post('/:id/variants', handleCreateVariant);
medicinesRouter.put('/:id', handleUpdateMedicine);
medicinesRouter.delete('/:id', handleDeleteMedicine);
medicinesRouter.post('/unarchive/:id', handleUnarchiveMedicine);
// unused in frontend
medicinesRouter.post('/unarchive/variant/:id', handleUnarchiveVariant);
