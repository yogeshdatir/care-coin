import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

interface Props {
  months: number;
  monthlyContribution: number;
  onMonthsChange: (n: number) => void;
  onContributionChange: (n: number) => void;
}

export function ForecastControls({
  months,
  monthlyContribution,
  onMonthsChange,
  onContributionChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="months">Forecast months</Label>
        <Input
          id="months"
          type="number"
          min={1}
          max={120}
          value={months}
          onChange={(e) => onMonthsChange(Math.max(0, Number(e.target.value)))}
          className="w-32"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contribution">Monthly contribution</Label>
        <Input
          id="contribution"
          type="number"
          min={0}
          value={monthlyContribution}
          onChange={(e) => onContributionChange(Number(e.target.value))}
          className="w-40"
        />
      </div>
    </div>
  );
}
