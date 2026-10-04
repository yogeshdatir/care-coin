export interface Change {
  amount: number;
  pct: number;
}

export function changeFrom(base: number, value: number): Change {
  const amount = value - base;
  return { amount, pct: base > 0 ? amount / base : 0 };
}
