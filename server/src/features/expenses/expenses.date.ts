const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/; // 2026-10-12 or 2026-10-12T00:00:00.000Z
const NUMERIC_RE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/; // 12/10/2026 (en-IN: day first)

const pad = (n: number) => String(n).padStart(2, '0');

/** True only for real calendar dates (rejects 2026-02-31). */
const toIsoDate = (y: number, m: number, d: number): string | null => {
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(iso)
    ? null
    : iso;
};

/**
 * Normalises a client date to YYYY-MM-DD, or returns null if unusable.
 * Accepts: ISO date/timestamp, en-IN numeric (DD/MM/YYYY), and month-name
 * locale strings ("12 Oct 2026", "October 12, 2026").
 */
export function normalizeDate(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();

  const iso = ISO_RE.exec(value);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const numeric = NUMERIC_RE.exec(value);
  if (numeric)
    return toIsoDate(
      Number(numeric[3]),
      Number(numeric[2]),
      Number(numeric[1]),
    );

  if (/[a-z]/i.test(value)) {
    const parsed = new Date(value); // parsed and read in the same (local) zone
    if (!Number.isNaN(parsed.getTime())) {
      return toIsoDate(
        parsed.getFullYear(),
        parsed.getMonth() + 1,
        parsed.getDate(),
      );
    }
  }
  return null;
}
