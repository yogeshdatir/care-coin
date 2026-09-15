import { Router } from 'express';
import { doctorsRouter } from '../features/doctors/doctors.routes';

export const apiRouter = Router();

apiRouter.use('/doctors', doctorsRouter);
