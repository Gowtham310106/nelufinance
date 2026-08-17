// src/features/purchases/purchase.validators.ts
import { z } from 'zod';
import { PAYMENT_METHODS, WEIGHT_UNITS } from '../../config/constants';

export const purchaseItemInputSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  inputUnit: z.enum(WEIGHT_UNITS).default('kg'),
  inputQuantity: z.number().positive('Quantity must be greater than 0'),
  ratePaisePerKg: z.number().positive('Rate must be greater than 0'),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().optional(),
  items: z.array(purchaseItemInputSchema).min(1, 'At least one item is required'),
  paidAmountPaise: z.number().min(0).default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  notes: z.string().max(500).optional().default(''),
  date: z.string().optional(), // ISO date string, defaults to now
});

export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
