// src/index.ts
import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { pool } from './db';
import router from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/', router);

app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: 'Database connection failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}: http://localhost:3000/test-db`);
});
