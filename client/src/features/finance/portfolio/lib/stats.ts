import type { PortfolioPoint } from '../types';
import { monthlyReturns } from './returns';

export interface PortfolioStats {
  invested: number;
  value: number;
  gain: number;
  gainPct: number;
  annualizedReturn: number | null; // null when not enough data
  volatility: number | null;
  maxDrawdown: number | null;
}

export function portfolioStats(
  series: PortfolioPoint[],
): PortfolioStats | null {
  const last = series[series.length - 1];
  if (!last) return null;

  const gain = last.value - last.invested;
  const base = {
    invested: last.invested,
    value: last.value,
    gain,
    gainPct: last.invested > 0 ? gain / last.invested : 0,
    annualizedReturn: null,
    volatility: null,
    maxDrawdown: null,
  };

  const r = monthlyReturns(series);
  if (r.length < 2) return base;

  // Annualized (geometric) return
  const growth = r.reduce((acc, x) => acc * (1 + x), 1);
  const annualizedReturn = growth > 0 ? growth ** (12 / r.length) - 1 : null;

  // Annualized volatility (sample std dev of monthly returns × √12)
  const mean = r.reduce((a, x) => a + x, 0) / r.length;
  const variance = r.reduce((a, x) => a + (x - mean) ** 2, 0) / (r.length - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(12);

  // Max drawdown on a return index (unaffected by deposits)
  let index = 1;
  let peak = 1;
  let maxDrawdown = 0;
  for (const x of r) {
    index *= 1 + x;
    peak = Math.max(peak, index);
    maxDrawdown = Math.min(maxDrawdown, index / peak - 1);
  }

  return { ...base, annualizedReturn, volatility, maxDrawdown };
}
