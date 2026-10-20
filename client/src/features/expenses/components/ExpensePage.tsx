import { fetchExpenses } from '@/shared/api/expense';
import type {
  Doctor,
  Expense,
  Medicine,
  Prescription,
} from '@carecoin/shared-types';
import { useEffect, useState } from 'react';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';
import { fetchDoctors } from '@/shared/api/doctor';
import { fetchPrescriptions } from '@/shared/api/prescription';
import { fetchMedicines } from '@/shared/api/medicines';
import { useHighlight } from '../useHighlight.ts';

const ExpensePage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<
    Expense['id'] | null
  >(null);
  const [duplicateSource, setDuplicateSource] = useState<Expense | null>(null);

  const handleDuplicate = (expense: Expense) => {
    setEditingExpenseId(null); // leave edit mode: this is a new expense
    setDuplicateSource(expense);
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const getExpenses = async () => {
      const fetchedExpenses: { data: Expense[] } | undefined =
        await fetchExpenses({ signal });
      setExpenses(fetchedExpenses?.data || []);
    };
    getExpenses();

    const getMedicines = async () => {
      const fetchedMedicines: { data: Medicine[] } = await fetchMedicines({
        signal,
      });
      setMedicines(fetchedMedicines?.data || []);
    };
    getMedicines();

    const getPrescriptions = async () => {
      const fetchedPrescriptions: { data: Prescription[] } =
        await fetchPrescriptions({
          signal,
        });
      setPrescriptions(fetchedPrescriptions?.data || []);
    };
    getPrescriptions();

    const getDoctors = async () => {
      const fetchedDoctors: { data: Doctor[] } | undefined = await fetchDoctors(
        { signal },
      );
      setDoctors(fetchedDoctors?.data || []);
    };
    getDoctors();

    return () => {
      controller.abort();
    };
  }, []);

  const { highlight, flash } = useHighlight();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-extrabold text-xl">Expenses</h1>
      <ExpenseForm
        expenses={expenses}
        setExpenses={setExpenses}
        medicines={medicines}
        setMedicines={setMedicines}
        prescriptions={prescriptions}
        doctors={doctors}
        editingExpenseId={editingExpenseId}
        setEditingExpenseId={setEditingExpenseId}
        duplicateSource={duplicateSource}
        setDuplicateSource={setDuplicateSource}
        flash={flash}
      />
      <ExpenseList
        expenses={expenses}
        setExpenses={setExpenses}
        medicines={medicines}
        prescriptions={prescriptions}
        doctors={doctors}
        setEditingExpenseId={setEditingExpenseId}
        handleDuplicate={handleDuplicate}
        highlight={highlight}
      />
    </div>
  );
};

export default ExpensePage;
