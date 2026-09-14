import { pool } from '../../db';
import { Doctor, CreateDoctorInput } from './doctors.types';

export const doctorsRepository = {
  async findAll(): Promise<Doctor[]> {
    const { rows } = await pool.query<Doctor>('SELECT * FROM doctors');
    return [];
  },
};
