const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Validate a YYYY-MM-DD date string is syntactically valid and represents a real date. */
export function isValidDateString(s: string): boolean {
  if (!DATE_REGEX.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
