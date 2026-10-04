import { TableCell } from '@/shared/components/ui/table';
import { changeFrom } from '../lib/change';
import { formatINR, formatINRSigned, formatPercent } from '../lib/format';
import { toneClass, toneOf } from '../lib/tone';

interface Props {
  value: number;
  base: number; // today's portfolio value
  emphasis?: boolean;
}

export function ForecastCell({ value, base, emphasis }: Props) {
  const { amount, pct } = changeFrom(base, value);
  return (
    <TableCell className="tabular-nums text-right">
      <div className={emphasis ? 'font-medium' : undefined}>
        {formatINR(value)}
      </div>
      <div className={`text-xs ${toneClass[toneOf(amount)]}`}>
        {formatINRSigned(amount)} ({formatPercent(pct)})
      </div>
    </TableCell>
  );
}
