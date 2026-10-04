import type { PortfolioPoint } from '../types';

/** Contribution-adjusted monthly returns (assumes new money arrives at month end). */
export function monthlyReturns(series: PortfolioPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1];
    const cur = series[i];
    if (prev.value <= 0) continue;
    const newMoney = cur.invested - prev.invested;
    out.push((cur.value - newMoney) / prev.value - 1);
  }
  return out;
}
