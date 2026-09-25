// src/utils/validation.ts
import { z } from 'zod';

/** A MongoDB ObjectId string. */
export const objectIdString = (label = 'id') =>
  z.string().regex(/^[a-f\d]{24}$/i, `Invalid ${label}`);

/** Money in paise: non-negative, rounded to a whole paisa (clients may send 5429.999…). */
export const paiseAmount = () => z.number().nonnegative().transform((v) => Math.round(v));

/** An ISO date / date-time string that parses to a real date. */
export const dateString = () =>
  z.string().refine((v) => !isNaN(new Date(v).getTime()), 'Invalid date');
