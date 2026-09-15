import type { Request, Response } from 'express';
import {
  getAllDoctors,
  createDoctor,
  deleteDoctor,
  updateDoctor,
} from './doctors.service';
import { requireStringParam } from '../../shared/utils';

export async function handleGetDoctors(req: Request, res: Response) {
  const doctors = await getAllDoctors();
  res.status(200).json({ data: doctors });
}

export async function handleCreateDoctor(req: Request, res: Response) {
  const doctor = await createDoctor(req.body);
  res.status(201).json(doctor);
}

export async function handleDeleteDoctor(req: Request, res: Response) {
  try {
    const id = requireStringParam(req.params.id, 'id');
    await deleteDoctor(id);
    res.status(204).send();
  } catch (err: any) {
    if (err.status === 400) {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'Cannot delete a doctor with existing prescriptions.',
      });
    }
    if (err.status === 404) {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
}

export async function handleUpdateDoctor(req: Request, res: Response) {
  try {
    const id = requireStringParam(req.params.id, 'id');
    const doctor = await updateDoctor(id, req.body);
    res.json(doctor);
  } catch (err: any) {
    if (err.status === 400) {
      return res.status(400).json({ message: err.message });
    }
    if (err.status === 404) {
      return res.status(404).json({ message: err.message });
    }
    throw err;
  }
}
