// src/features/weight-reconciliation/weight-reconciliation.validators.ts
import { z } from 'zod';

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createWeightReconciliationSchema = z
  .object({
    lorryNumber: z.string().min(1, 'Lorry number is required').max(30).trim(),
    driverName: z.string().max(100).trim().optional().default(''),
    driverPhone: z.string().max(20).trim().optional().default(''),
    supplierId: objectIdString.optional().or(z.literal('')),
    productId: objectIdString,
    grossWeightKg: z.number().positive('Gross weight must be greater than 0'),
    tareWeightKg: z.number().nonnegative('Tare weight must be greater than or equal to 0'),
    bagCount: z.number().int('Bag count must be a whole number').positive('Bag count must be greater than 0'),
    bagStandardWeightKg: z.number().positive().default(75),
    actionTaken: z
      .enum(['ACCEPT_WEIGHBRIDGE', 'ACCEPT_BAG_COUNT', 'SPLIT_DIFFERENCE', 'DISPUTED'])
      .default('ACCEPT_WEIGHBRIDGE'),
    notes: z.string().max(500).optional().default(''),
    date: z
      .string()
      .refine((s) => !isNaN(new Date(s).getTime()), 'Invalid date')
      .optional(),
  })
  .refine((d) => d.tareWeightKg < d.grossWeightKg, {
    message: 'Tare weight must be less than gross weight',
    path: ['tareWeightKg'],
  });

export type CreateWeightReconciliationInput = z.infer<
  typeof createWeightReconciliationSchema
>;
