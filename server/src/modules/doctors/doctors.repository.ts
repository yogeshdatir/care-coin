import type { Doctor } from '@carecoin/shared-types';
import { pool } from '../../db';

export const doctorsRepository = {
  async findAll(): Promise<Doctor[]> {
    const { rows } = await pool.query<Doctor>('SELECT * FROM doctors');
    return [];
  },
};
