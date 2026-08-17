// src/features/weight-reconciliation/weight-reconciliation.validators.ts
import { z } from 'zod';

export const createWeightReconciliationSchema = z.object({
  lorryNumber: z.string().min(1, 'Lorry number is required').max(30).trim(),
  driverName: z.string().max(100).trim().optional().default(''),
  driverPhone: z.string().max(20).trim().optional().default(''),
  supplierId: z.string().optional(),
  productId: z.string().min(1, 'Product is required'),
  grossWeightKg: z.number().positive('Gross weight must be greater than 0'),
  tareWeightKg: z.number().nonnegative('Tare weight must be greater than or equal to 0'),
  bagCount: z.number().positive('Bag count must be greater than 0'),
  bagStandardWeightKg: z.number().positive().default(75),
  actionTaken: z
    .enum(['ACCEPT_WEIGHBRIDGE', 'ACCEPT_BAG_COUNT', 'SPLIT_DIFFERENCE', 'DISPUTED'])
    .default('ACCEPT_WEIGHBRIDGE'),
  notes: z.string().max(500).optional().default(''),
  date: z.string().optional(),
});

export type CreateWeightReconciliationInput = z.infer<
  typeof createWeightReconciliationSchema
>;
