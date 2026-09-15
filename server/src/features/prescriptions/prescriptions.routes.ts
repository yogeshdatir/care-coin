import { Router } from 'express';
import {
  handleGetPrescriptions,
  handleCreatePrescription,
} from './prescriptions.controller';

export const prescriptionsRouter = Router();

prescriptionsRouter.get('/', handleGetPrescriptions);
prescriptionsRouter.post('/', handleCreatePrescription);
