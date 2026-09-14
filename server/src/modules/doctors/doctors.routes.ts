import { Router } from 'express';
import { doctorsController } from './doctors.controller';

const router = Router();

router.get('/', doctorsController.getAll);

export default router;
