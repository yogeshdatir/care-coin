import type { Request, Response } from 'express';
import {
  getAllPrescriptions,
  createPrescription,
  updatePrescription,
} from './prescriptions.service';
import { requireStringParam } from '../../shared/utils';

export async function handleGetPrescriptions(req: Request, res: Response) {
  const prescriptions = await getAllPrescriptions();
  res.json({ data: prescriptions }); // wrapped, per requirement
}

export async function handleCreatePrescription(req: Request, res: Response) {
  const prescription = await createPrescription(req.body);
  res.status(201).json(prescription); // create response left unwrapped — confirm if this should also wrap
}

export async function handleUpdatePrescription(req: Request, res: Response) {
  try {
    const id = requireStringParam(req.params.id, 'id');
    const prescription = await updatePrescription(id, req.body);
    res.json(prescription);
  } catch (err: any) {
    if (err.status === 404)
      return res.status(404).json({ message: err.message });
    throw err;
  }
}
