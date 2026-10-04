export interface HoldingSnapshot {
  snapshotDate: string;
  ts: number;
  instrument: string;
  assetClass: string;
  totalInvested: number;
  currentValue: number;
}

export interface PortfolioPoint {
  ts: number;
  invested: number;
  value: number;
}

export interface ForecastPoint {
  ts: number;
  p10: number;
  p50: number;
  p90: number;
}

// One x-axis position. Historical and forecast fields are optional, so each series gets gaps where it doesn't apply.
export interface ChartDatum {
  label: string;
  invested?: number;
  value?: number;
  forecast?: number;
  band?: [low: number, high: number];
}
