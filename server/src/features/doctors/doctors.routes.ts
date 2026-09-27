import { Router } from 'express';
import {
  handleGetDoctors,
  handleCreateDoctor,
  handleDeleteDoctor,
  handleUpdateDoctor,
  handleGetDoctorById,
} from './doctors.controller';

export const doctorsRouter = Router();

doctorsRouter.get('/', handleGetDoctors);
doctorsRouter.get('/:id', handleGetDoctorById);
doctorsRouter.post('/', handleCreateDoctor);
doctorsRouter.delete('/:id', handleDeleteDoctor);
doctorsRouter.put('/:id', handleUpdateDoctor);
