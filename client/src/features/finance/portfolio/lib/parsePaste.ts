import type { HoldingSnapshot } from '../types';

const toNumber = (raw = ''): number => {
  const s = raw.trim();
  const negative = /^\(.*\)$/.test(s); // (1,000) => -1000
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(n)) return 0;
  return negative ? -Math.abs(n) : n;
};

const toTimestamp = (raw: string): number => {
  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) return direct;
  // fallback: dd/mm/yyyy or dd-mm-yyyy
  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]).getTime() : NaN;
};

export function parseHoldingSnapshots(text: string): HoldingSnapshot[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2)
    throw new Error('Paste the header row plus at least one data row.');

  // Header-based lookup => column order doesn't matter
  const headers = lines[0].split('\t').map((h) => h.trim().toLowerCase());
  const col = (name: string) => {
    const i = headers.indexOf(name.toLowerCase());
    if (i === -1) throw new Error(`Missing column: "${name}"`);
    return i;
  };
  const iDate = col('Snapshot Date');
  const iInstr = col('Instrument Name');
  const iClass = col('Asset Class');
  const iInv = col('Total Invested');
  const iVal = col('Current Value');

  return lines.slice(1).map((line, idx) => {
    const c = line.split('\t');
    const snapshotDate = (c[iDate] ?? '').trim();
    const ts = toTimestamp(snapshotDate);
    if (Number.isNaN(ts))
      throw new Error(
        `HoldingSnapshot ${idx + 2}: unrecognized date "${snapshotDate}"`,
      );
    return {
      snapshotDate,
      ts,
      instrument: (c[iInstr] ?? '').trim(),
      assetClass: (c[iClass] ?? '').trim(),
      totalInvested: toNumber(c[iInv]),
      currentValue: toNumber(c[iVal]),
    };
  });
}
