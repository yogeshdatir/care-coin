import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type {
  Doctor,
  Expense,
  Medicine,
  Prescription,
} from '@carecoin/shared-types';
import {
  getCategoryLabel,
  getExpenseItemLabel,
  getPrescriptionLabelFromPrescId,
  getTotalOfExpenses,
  sortExpenses,
} from '../helper';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { deleteExpense } from '@/shared/api/expense';
import { DeleteConfirmationDialog } from '@/features/health/doctors/components/DeleteConfirmationDialog';
import { BookCopy, Pencil } from 'lucide-react';
import { useMemo } from 'react';
import type { Highlight } from '../useHighlight';

type Props = {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  medicines: Medicine[];
  prescriptions: Prescription[];
  doctors: Doctor[];
  setEditingExpenseId: React.Dispatch<React.SetStateAction<string | null>>;
  handleDuplicate: (expense: Expense) => void;
  highlight: Highlight;
};

const ExpenseList = ({
  expenses,
  setExpenses,
  medicines,
  prescriptions,
  doctors,
  setEditingExpenseId,
  handleDuplicate,
  highlight,
}: Props) => {
  const handleEditExpense = (expenseId: Expense['id']) => {
    setEditingExpenseId(expenseId);
  };

  const handleDeleteExpense = async (expenseId: Expense['id']) => {
    await deleteExpense(expenseId);

    setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
  };

  const sortedExpenses = useMemo(() => sortExpenses(expenses), [expenses]);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h3 className="font-bold text-lg">All expenses</h3>
        <div className="flex gap-2">
          <span>{expenses.length} expenses</span>·
          <span className="flex gap-2">
            Total
            <span className="font-bold">
              {formatCurrency(getTotalOfExpenses(expenses))}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200 border-gray-600 border-b">
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Prescription</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExpenses.map((expense: Expense) => {
              const {
                id,
                date,
                category,
                linkedPrescriptionId,
                amount,
                receiptUrl,
              } = expense;
              const highlightKind =
                highlight?.id === id ? highlight.kind : null;

              return (
                <TableRow
                  key={id}
                  className={cn(
                    'duration-700',
                    highlightKind && 'bg-primary/10',
                  )}
                >
                  <TableCell className="font-medium">
                    {date}
                    {highlightKind && (
                      <Badge className="ml-2">
                        {highlightKind === 'added' ? 'New' : 'Updated'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getCategoryLabel(category)}</TableCell>
                  <TableCell>
                    {getExpenseItemLabel(expense, medicines)}
                  </TableCell>
                  <TableCell>
                    {linkedPrescriptionId
                      ? getPrescriptionLabelFromPrescId(
                          linkedPrescriptionId,
                          prescriptions,
                          doctors,
                        )
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(amount)}
                  </TableCell>
                  <TableCell>
                    {receiptUrl ? (
                      <Button asChild variant="link" className="px-0">
                        <a href={receiptUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleEditExpense(id)}
                        title="Edit expense"
                        aria-label="Edit expense"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleDuplicate(expense)}
                        title="Duplicate expense"
                        aria-label="Duplicate expense"
                      >
                        <BookCopy />
                      </Button>
                      <DeleteConfirmationDialog
                        id={id}
                        onConfirmDelete={handleDeleteExpense}
                        title="Delete expense?"
                        description="This will permanently delete this expense."
                        buttonTitle="Delete expense"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ExpenseList;
