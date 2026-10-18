import type { Expense } from '@carecoin/shared-types';

type Props = { expenses: Expense[] };

const ExpenseList = ({ expenses }: Props) => {
  return (
    <div>
      {expenses.map((e) => {
        return <div key={e.id}>{e.amount}</div>;
      })}
    </div>
  );
};

export default ExpenseList;
