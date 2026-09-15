import type { Request, Response } from 'express';
import { getAllDoctors, createDoctor } from './doctors.service';

export async function handleGetDoctors(req: Request, res: Response) {
  const doctors = await getAllDoctors();
  res.status(200).json({ data: doctors });
}

export async function handleCreateDoctor(req: Request, res: Response) {
  const doctor = await createDoctor(req.body);
  res.status(201).json(doctor);
}
