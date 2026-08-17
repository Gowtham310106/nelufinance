// src/features/sales/sale.validators.ts
import { z } from 'zod';
import { PAYMENT_METHODS, WEIGHT_UNITS } from '../../config/constants';

export const saleItemInputSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  inputUnit: z.enum(WEIGHT_UNITS).default('kg'),
  inputQuantity: z.number().positive('Quantity must be greater than 0'),
  ratePaisePerKg: z.number().positive('Rate must be greater than 0'),
});

export const createSaleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(saleItemInputSchema).min(1, 'At least one item is required'),
  receivedAmountPaise: z.number().min(0).default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  notes: z.string().max(500).optional().default(''),
  date: z.string().optional(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
