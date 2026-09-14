import { Router } from 'express';
import doctorsRoutes from '../modules/doctors/doctors.routes';

const router = Router();

router.use('/doctors', doctorsRoutes);

export default router;
