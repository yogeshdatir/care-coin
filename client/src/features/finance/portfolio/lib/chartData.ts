import type { ChartDatum, ForecastPoint, PortfolioPoint } from '../types';
import { formatMonth } from './dates';

export function buildChartData(
  series: PortfolioPoint[],
  forecast: ForecastPoint[],
): ChartDatum[] {
  const lastIdx = series.length - 1;

  const history: ChartDatum[] = series.map((p, i) => ({
    label: formatMonth(p.ts),
    invested: p.invested,
    value: p.value,
    // Anchor: forecast line starts at the last real value, so the lines connect
    ...(i === lastIdx
      ? { forecast: p.value, band: [p.value, p.value] as [number, number] }
      : {}),
  }));

  const future: ChartDatum[] = forecast.map((f) => ({
    label: formatMonth(f.ts),
    forecast: f.p50,
    band: [f.p10, f.p90],
  }));

  return [...history, ...future];
}
