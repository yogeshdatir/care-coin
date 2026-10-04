import type { ForecastPoint, PortfolioPoint } from '../../types';
import { addMonths } from '../dates';
import { monthlyReturns } from '../returns';

export const MIN_RETURNS = 3; // hard minimum: below this, no forecast
export const RECOMMENDED_RETURNS = 12; // below this, show a warning

export interface ForecastOptions {
  months: number;
  monthlyContribution: number;
  simulations?: number;
  rng?: () => number; // injectable => deterministic tests
}

export function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

export function forecastPortfolio(
  series: PortfolioPoint[],
  {
    months,
    monthlyContribution,
    simulations = 1000,
    rng = mulberry32(42),
  }: ForecastOptions,
): ForecastPoint[] {
  const returns = monthlyReturns(series);
  if (returns.length < MIN_RETURNS || months < 1) return [];

  const start = series[series.length - 1];

  // paths[sim][month]
  const paths = Array.from({ length: simulations }, () => {
    let v = start.value;
    return Array.from({ length: months }, () => {
      const r = returns[Math.floor(rng() * returns.length)];
      v = v * (1 + r) + monthlyContribution;
      return v;
    });
  });

  return Array.from({ length: months }, (_, m) => {
    const col = paths.map((p) => p[m]).sort((a, b) => a - b);
    return {
      ts: addMonths(start.ts, m + 1),
      p10: percentile(col, 0.1),
      p50: percentile(col, 0.5),
      p90: percentile(col, 0.9),
    };
  });
}
