import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { Doctor, Expense, Prescription } from '@carecoin/shared-types';
import { getPrescriptionLabelFromPrescId, getTotalOfExpenses } from '../helper';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/shared/components/ui/button';

type Props = {
  expenses: Expense[];
  prescriptions: Prescription[];
  doctors: Doctor[];
  setEditingExpenseId: React.Dispatch<React.SetStateAction<string | null>>;
};

const ExpenseList = ({
  expenses,
  prescriptions,
  doctors,
  setEditingExpenseId,
}: Props) => {
  const handleEditExpense = (expenseId: Expense['id']) => {
    setEditingExpenseId(expenseId);
  };

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
          <TableCaption>A list of your recent expenses.</TableCaption>
          <TableHeader>
            <TableRow className="bg-gray-200 border-gray-600 border-b">
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Prescription</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map(
              ({
                id,
                date,
                category,
                description,
                linkedPrescriptionId,
                amount,
                receiptUrl,
              }: Expense) => (
                <TableRow key={id}>
                  <TableCell className="font-medium">{date}</TableCell>
                  <TableCell>{category}</TableCell>
                  <TableCell>{description}</TableCell>
                  <TableCell>
                    {getPrescriptionLabelFromPrescId(
                      linkedPrescriptionId,
                      prescriptions,
                      doctors,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(amount)}
                  </TableCell>
                  <TableCell>{receiptUrl}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="link"
                      onClick={() => handleEditExpense(id)}
                    >
                      Edit
                    </Button>
                    ·<Button variant="link">Delete</Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ExpenseList;
