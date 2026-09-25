// src/lib/dates.ts
// Local-time (device / IST) date helpers. Never use toISOString().slice(0, 10) for
// "today" — that is the UTC date, which is yesterday before 05:30 IST.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD for the given date in the device's local timezone. */
export function toLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local date as YYYY-MM-DD. */
export function todayLocal(): string {
  return toLocalDateString(new Date());
}

/** ISO timestamp of local midnight at the start of the given day. */
export function startOfLocalDayISO(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** ISO timestamp of 23:59:59.999 local time on the given day. */
export function endOfLocalDayISO(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
