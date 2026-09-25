// src/features/inventory/inventory.validators.ts
import { z } from 'zod';
import { objectIdString } from '../../utils/validation';

export const stockAdjustmentSchema = z.object({
  productId: objectIdString('product'),
  type: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  quantityKg: z.number().positive('Quantity must be greater than 0'),
  reason: z.string().min(3, 'Reason is mandatory (min 3 chars)').max(300),
  notes: z.string().max(500).optional().default(''),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
