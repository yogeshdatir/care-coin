import { Router } from 'express';
import { handleGetDoctors, handleCreateDoctor } from './doctors.controller';

export const doctorsRouter = Router();

doctorsRouter.get('/', handleGetDoctors);
doctorsRouter.post('/', handleCreateDoctor);
