import { Router, text } from 'express';
import {
  handleGetExpenses,
  handleGetExpenseById,
  handleCreateExpense,
  handleUpdateExpense,
  handleDeleteExpense,
} from './expenses.controller';
import { handleImportExpenses } from './import/expenses.import.controller';

export const expensesRouter = Router();

expensesRouter.get('/', handleGetExpenses);
// Must be declared before '/:id' routes so "import" is not read as an id.
expensesRouter.post(
  '/import',
  text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),
  handleImportExpenses,
);
expensesRouter.get('/:id', handleGetExpenseById);
expensesRouter.post('/', handleCreateExpense);
expensesRouter.put('/:id', handleUpdateExpense);
expensesRouter.delete('/:id', handleDeleteExpense);
