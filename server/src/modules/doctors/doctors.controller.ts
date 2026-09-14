import { Request, Response, NextFunction } from 'express';
import { doctorsRepository } from './doctors.repository';

export const doctorsController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const doctors = await doctorsRepository.findAll();
      res.json(doctors);
    } catch (err) {
      next(err);
    }
  },
};
