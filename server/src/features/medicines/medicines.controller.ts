import type { Request, Response } from 'express';
import {
  getAllMedicines,
  createMedicine,
  createVariant,
  updateMedicine,
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

export async function handleUpdateMedicine(req: Request, res: Response) {
  try {
    const id = requireStringParam(req.params.id, 'id');
    const medicine = await updateMedicine(id, req.body);
    res.json(medicine);
  } catch (err: any) {
    if (err.code === '23503') {
      return res.status(409).json({
        message:
          'Cannot remove a variant that is used in an existing prescription.',
      });
    }
    if (err.status === 404)
      return res.status(404).json({ message: err.message });
    throw err;
  }
}
