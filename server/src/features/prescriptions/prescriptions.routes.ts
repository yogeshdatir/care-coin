import { Router } from 'express';
import {
  handleGetPrescriptions,
  handleCreatePrescription,
  handleUpdatePrescription,
  handleDeletePrescription,
  handleGetPrescriptionById,
} from './prescriptions.controller';

export const prescriptionsRouter = Router();

prescriptionsRouter.get('/', handleGetPrescriptions);
prescriptionsRouter.get('/:id', handleGetPrescriptionById);
prescriptionsRouter.post('/', handleCreatePrescription);
prescriptionsRouter.put('/:id', handleUpdatePrescription);
prescriptionsRouter.delete('/:id', handleDeletePrescription);
