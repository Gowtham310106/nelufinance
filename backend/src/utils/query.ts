// src/utils/query.ts
import { Types } from 'mongoose';

/** Escape user input before using it inside a RegExp (prevents 500s and ReDoS). */
export function escapeRegex(input: string): string {
  return input.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" regex for search boxes. */
export function searchRegex(input: string): RegExp {
  return new RegExp(escapeRegex(input.trim()), 'i');
}

/** Businesses operate in India (IST, UTC+05:30, no DST). */
export const BUSINESS_TZ_OFFSET = '+05:30';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

/** Today's calendar date in IST as YYYY-MM-DD. */
export function todayIst(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Start and end instants of an IST calendar day (YYYY-MM-DD). */
export function istDayRange(dateStr: string): { start: Date; end: Date } {
  if (!DATE_ONLY.test(dateStr)) throw httpError(`Invalid date: ${dateStr}`, 400);
  const start = new Date(`${dateStr}T00:00:00.000${BUSINESS_TZ_OFFSET}`);
  if (isNaN(start.getTime())) throw httpError(`Invalid date: ${dateStr}`, 400);
  return { start, end: new Date(start.getTime() + DAY_MS - 1) };
}

/**
 * Parse a date filter bound. A date-only value ("2026-09-25") covers the whole IST day,
 * so an end bound includes every transaction made on that day.
 */
export function parseDateBound(value: string, bound: 'start' | 'end'): Date {
  if (DATE_ONLY.test(value)) {
    const range = istDayRange(value);
    return bound === 'start' ? range.start : range.end;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) throw httpError(`Invalid date: ${value}`, 400);
  return date;
}

/** Build a { $gte, $lte } Mongo filter from optional start/end query strings. */
export function dateRangeFilter(startDate?: string, endDate?: string): Record<string, Date> | undefined {
  if (!startDate && !endDate) return undefined;
  const filter: Record<string, Date> = {};
  if (startDate) filter.$gte = parseDateBound(startDate, 'start');
  if (endDate) filter.$lte = parseDateBound(endDate, 'end');
  return filter;
}

/** Throw a 400 unless `id` is a valid ObjectId. */
export function assertObjectId(id: unknown, label = 'id'): string {
  if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
    throw httpError(`Invalid ${label}`, 400);
  }
  return id;
}
