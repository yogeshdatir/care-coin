import { fetchExpenses } from '@/shared/api/expense';
import type { Expense } from '@carecoin/shared-types';
import { useEffect, useState } from 'react';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';

const ExpensePage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const getExpenses = async () => {
      const fetchedExpenses: { data: Expense[] } | undefined =
        await fetchExpenses({ signal });
      setExpenses(fetchedExpenses?.data || []);
    };
    getExpenses();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div>
      <h1>Expenses</h1>
      <ExpenseForm setExpenses={setExpenses} />
      <ExpenseList expenses={expenses} />
    </div>
  );
};

export default ExpensePage;
