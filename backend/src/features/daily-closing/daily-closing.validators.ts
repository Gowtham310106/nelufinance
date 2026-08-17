// src/features/daily-closing/daily-closing.validators.ts
import { z } from 'zod';

export const denominationCountSchema = z.object({
  d500: z.number().int().nonnegative().default(0),
  d200: z.number().int().nonnegative().default(0),
  d100: z.number().int().nonnegative().default(0),
  d50: z.number().int().nonnegative().default(0),
  d20: z.number().int().nonnegative().default(0),
  d10: z.number().int().nonnegative().default(0),
  coins: z.number().int().nonnegative().default(0),
});

export const submitDailyClosingSchema = z.object({
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  openingCashPaise: z.number().nonnegative().default(0),
  denominations: denominationCountSchema,
  notes: z.string().max(500).optional().default(''),
});

export type SubmitDailyClosingInput = z.infer<typeof submitDailyClosingSchema>;
