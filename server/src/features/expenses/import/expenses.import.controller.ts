import type { Request, Response } from 'express';
import { parseExpensesCsv } from './expenses.csv';
import { importExpenses } from './expenses.import.service';

/** POST /expenses/import — body is the raw CSV text (Content-Type: text/csv). */
export async function handleImportExpenses(req: Request, res: Response) {
  if (typeof req.body !== 'string' || req.body.trim() === '') {
    return res
      .status(400)
      .json({
        message: 'Send the CSV as the request body (Content-Type: text/csv)',
      });
  }

  const { rows, errors } = await parseExpensesCsv(req.body);
  if (errors.length > 0) {
    // Nothing is written when any row is invalid.
    return res
      .status(400)
      .json({ message: 'CSV has invalid rows. Nothing was imported.', errors });
  }

  res.status(201).json(await importExpenses(rows));
}
