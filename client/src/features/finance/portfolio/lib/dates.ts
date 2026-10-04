export const addMonths = (ts: number, n: number): number => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
};

export const formatMonth = (ts: number): string =>
  new Date(ts).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
