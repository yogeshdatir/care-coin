import type { Request, Response } from 'express';
import {
  getAllPrescriptions,
  createPrescription,
} from './prescriptions.service';

export async function handleGetPrescriptions(req: Request, res: Response) {
  const prescriptions = await getAllPrescriptions();
  res.json({ data: prescriptions }); // wrapped, per requirement
}

export async function handleCreatePrescription(req: Request, res: Response) {
  const prescription = await createPrescription(req.body);
  res.status(201).json(prescription); // create response left unwrapped — confirm if this should also wrap
}
