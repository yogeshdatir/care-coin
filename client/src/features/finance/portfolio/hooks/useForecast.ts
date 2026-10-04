import { useMemo } from 'react';
import { forecastPortfolio } from '../lib/forecast/monteCarlo';
import type { PortfolioPoint } from '../types';

export function useForecast(
  series: PortfolioPoint[],
  months: number,
  monthlyContribution: number,
) {
  return useMemo(
    () => forecastPortfolio(series, { months, monthlyContribution }),
    [series, months, monthlyContribution],
  );
}
