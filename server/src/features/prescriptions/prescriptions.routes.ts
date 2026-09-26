import { Router } from 'express';
import {
  handleGetPrescriptions,
  handleCreatePrescription,
  handleUpdatePrescription,
} from './prescriptions.controller';

export const prescriptionsRouter = Router();

prescriptionsRouter.get('/', handleGetPrescriptions);
prescriptionsRouter.post('/', handleCreatePrescription);
prescriptionsRouter.put('/:id', handleUpdatePrescription);
