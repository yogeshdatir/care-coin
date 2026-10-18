import { Router } from 'express';
import {
  handleGetExpenses,
  handleGetExpenseById,
  handleCreateExpense,
  handleUpdateExpense,
  handleDeleteExpense,
} from './expenses.controller';

export const expensesRouter = Router();

expensesRouter.get('/', handleGetExpenses);
expensesRouter.get('/:id', handleGetExpenseById);
expensesRouter.post('/', handleCreateExpense);
expensesRouter.put('/:id', handleUpdateExpense);
expensesRouter.delete('/:id', handleDeleteExpense);
