export const emptyToNull = (value?: string | null): string | null =>
  value ? value : null;

export function requireStringParam(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw Object.assign(new Error(`Missing or invalid ${name}`), {
      status: 400,
    });
  }
  return value;
}
