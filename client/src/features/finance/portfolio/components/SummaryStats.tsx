import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatINR, formatPercent } from '../lib/format';
import { pickMilestones } from '../lib/milestones';
import { portfolioStats } from '../lib/stats';
import type { ForecastPoint, PortfolioPoint } from '../types';
import { StatTile } from './StatTile';
import { ForecastCell } from './ForecastCell';
import { TermHint } from './TermHint';

interface Props {
  series: PortfolioPoint[];
  forecast: ForecastPoint[];
  monthlyContribution: number;
}

const orDash = (n: number | null, fmt: (n: number) => string) =>
  n === null ? '–' : fmt(n);
const tone = (n: number) =>
  n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral';

export function SummaryStats({ series, forecast, monthlyContribution }: Props) {
  const stats = useMemo(() => portfolioStats(series), [series]);
  const milestones = useMemo(() => pickMilestones(forecast), [forecast]);

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
          <StatTile label="Current value" value={formatINR(stats.value)} />
          <StatTile label="Total invested" value={formatINR(stats.invested)} />
          <StatTile
            label="Gain / Loss"
            value={formatINR(stats.gain)}
            hint={formatPercent(stats.gainPct)}
            tone={tone(stats.gain)}
          />
          <StatTile
            label="Annualized return"
            value={orDash(stats.annualizedReturn, formatPercent)}
            tone={
              stats.annualizedReturn === null
                ? 'neutral'
                : tone(stats.annualizedReturn)
            }
            hint="Excludes deposits"
          />
          <StatTile
            label="Volatility (annual)"
            value={orDash(stats.volatility, formatPercent)}
          />
          <StatTile
            label="Max drawdown"
            value={orDash(stats.maxDrawdown, formatPercent)}
            tone={stats.maxDrawdown ? 'negative' : 'neutral'}
          />
        </div>

        {milestones.length > 0 && (
          <div>
            <h3 className="mb-2 font-medium text-sm">Forecast range</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horizon</TableHead>
                  <TableHead className="text-right">
                    <TermHint hint="1 in 10 simulated futures ended below this. A bad-but-plausible outcome, not the worst case.">
                      Low (P10)
                    </TermHint>
                  </TableHead>
                  <TableHead className="text-right">
                    <TermHint hint="Half of the simulated futures ended below this and half above. The typical outcome.">
                      Median (P50)
                    </TermHint>
                  </TableHead>
                  <TableHead className="text-right">
                    <TermHint hint="9 in 10 simulated futures ended below this. A good-but-plausible outcome, not the best case.">
                      High (P90)
                    </TermHint>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map(({ months, label, point }) => (
                  <TableRow key={months}>
                    <TableCell>{label}</TableCell>
                    <ForecastCell value={point.p10} base={stats.value} />
                    <ForecastCell
                      value={point.p50}
                      base={stats.value}
                      emphasis
                    />
                    <ForecastCell value={point.p90} base={stats.value} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-muted-foreground text-xs">
              Based on 1,000 simulations of your past returns. Low: 1 in 10
              ended below it. High: 1 in 10 ended above it. Change is vs today's
              value of {formatINR(stats.value)}
              {monthlyContribution > 0 &&
                `, and includes your ${formatINR(monthlyContribution)}/month deposits`}
              . Not financial advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
