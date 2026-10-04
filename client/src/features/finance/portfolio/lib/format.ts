const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** ₹12,34,567 */
export const formatINR = (n: number): string => inr.format(n);

/** 12.3L, 1.2Cr: for axis ticks */
export const formatINRCompact = (n: number): string => inrCompact.format(n);

const pct = new Intl.NumberFormat('en-IN', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

/** +12.3%, -4.5% */
export const formatPercent = (n: number): string => pct.format(n);

const inrSigned = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  signDisplay: 'exceptZero',
});

/** +₹1,20,000 / -₹45,000 */
export const formatINRSigned = (n: number): string => inrSigned.format(n);
