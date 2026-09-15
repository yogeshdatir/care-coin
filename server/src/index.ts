// src/index.ts
import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { apiRouter } from './routes';
import { pool } from './db/pool';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: 'http://localhost:5173', // your Vite dev server
  }),
);

app.use(express.json());

app.use('/', apiRouter);

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
