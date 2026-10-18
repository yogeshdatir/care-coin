import type { RouteObject } from 'react-router';
import ExpensePage from './components/ExpensePage';

export const expensesRoutes: RouteObject[] = [
  { path: '/expenses', element: <ExpensePage /> },
];
