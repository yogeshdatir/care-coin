import type { Request, Response } from 'express';
import {
  getAllMedicines,
  createMedicine,
  createVariant,
} from './medicines.service';
import { requireStringParam } from '../../shared/utils';

export async function handleGetMedicines(req: Request, res: Response) {
  const medicines = await getAllMedicines();
  res.json({ data: medicines });
}

export async function handleCreateMedicine(req: Request, res: Response) {
  const medicine = await createMedicine(req.body);
  res.status(201).json(medicine);
}

export async function handleCreateVariant(req: Request, res: Response) {
  try {
    const medicineId = requireStringParam(req.params.id, 'id');
    const variant = await createVariant(medicineId, req.body);
    res.status(201).json(variant);
  } catch (err: any) {
    if (err.status === 400) {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === '23503') {
      // FK violation — medicineId doesn't exist
      return res.status(404).json({ message: 'Medicine not found' });
    }
    throw err;
  }
}
