import type { HoldingSnapshot, PortfolioPoint } from '../types';

export function toPortfolioSeries(
  snapshots: HoldingSnapshot[],
): PortfolioPoint[] {
  const byTs = new Map<number, PortfolioPoint>();
  for (const s of snapshots) {
    const p = byTs.get(s.ts) ?? { ts: s.ts, invested: 0, value: 0 };
    p.invested += s.totalInvested;
    p.value += s.currentValue;
    byTs.set(s.ts, p);
  }
  return [...byTs.values()].sort((a, b) => a.ts - b.ts);
}
