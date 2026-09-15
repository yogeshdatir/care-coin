import { Router } from 'express';
import {
  handleGetDoctors,
  handleCreateDoctor,
  handleDeleteDoctor,
  handleUpdateDoctor,
} from './doctors.controller';

export const doctorsRouter = Router();

doctorsRouter.get('/', handleGetDoctors);
doctorsRouter.post('/', handleCreateDoctor);
doctorsRouter.delete('/:id', handleDeleteDoctor);
doctorsRouter.put('/:id', handleUpdateDoctor);
