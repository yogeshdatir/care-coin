import type { Request, Response } from 'express';
import { getAllMedicines, createMedicine } from './medicines.service';

export async function handleGetMedicines(req: Request, res: Response) {
  const medicines = await getAllMedicines();
  res.json({ data: medicines });
}

export async function handleCreateMedicine(req: Request, res: Response) {
  const medicine = await createMedicine(req.body);
  res.status(201).json(medicine);
}
