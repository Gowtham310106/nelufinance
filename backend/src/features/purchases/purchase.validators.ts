// src/features/purchases/purchase.validators.ts
import { z } from 'zod';
import { objectIdString, paiseAmount, dateString } from '../../utils/validation';
import { PAYMENT_METHODS, WEIGHT_UNITS } from '../../config/constants';

export const purchaseItemInputSchema = z.object({
  productId: objectIdString('product'),
  inputUnit: z.enum(WEIGHT_UNITS).default('kg'),
  inputQuantity: z.number().positive('Quantity must be greater than 0'),
  ratePaisePerKg: paiseAmount().refine((v) => v > 0, 'Rate must be greater than 0'),
});

export const createPurchaseSchema = z.object({
  supplierId: objectIdString('supplier').optional(),
  items: z.array(purchaseItemInputSchema).min(1, 'At least one item is required'),
  paidAmountPaise: paiseAmount().default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  notes: z.string().max(500).optional().default(''),
  date: dateString().optional(), // ISO date string, defaults to now
});

export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
