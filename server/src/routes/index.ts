import { Router } from 'express';
import { doctorsRouter } from '../features/doctors/doctors.routes';
import { medicinesRouter } from '../features/medicines/medicines.routes';
import { prescriptionsRouter } from '../features/prescriptions/prescriptions.routes';

export const apiRouter = Router();

apiRouter.use('/doctors', doctorsRouter);
apiRouter.use('/medicines', medicinesRouter);
apiRouter.use('/prescriptions', prescriptionsRouter);
