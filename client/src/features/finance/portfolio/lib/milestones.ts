import type { ForecastPoint } from '../types';

const MILESTONE_MONTHS = [12, 36, 60];

export interface Milestone {
  months: number;
  label: string;
  point: ForecastPoint;
}

/** 1/3/5-year points that fit in the forecast, plus the final month. */
export function pickMilestones(forecast: ForecastPoint[]): Milestone[] {
  if (forecast.length === 0) return [];
  const months = new Set(MILESTONE_MONTHS.filter((m) => m <= forecast.length));
  months.add(forecast.length);

  return [...months]
    .sort((a, b) => a - b)
    .map((m) => ({
      months: m,
      label: m % 12 === 0 ? `${m / 12} yr` : `${m} mo`,
      point: forecast[m - 1],
    }));
}
