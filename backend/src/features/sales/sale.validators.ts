// src/features/sales/sale.validators.ts
import { z } from 'zod';
import { objectIdString, paiseAmount, dateString } from '../../utils/validation';
import { PAYMENT_METHODS, WEIGHT_UNITS } from '../../config/constants';

export const saleItemInputSchema = z.object({
  productId: objectIdString('product'),
  inputUnit: z.enum(WEIGHT_UNITS).default('kg'),
  inputQuantity: z.number().positive('Quantity must be greater than 0'),
  ratePaisePerKg: paiseAmount().refine((v) => v > 0, 'Rate must be greater than 0'),
});

export const createSaleSchema = z.object({
  customerId: objectIdString('customer').optional(),
  items: z.array(saleItemInputSchema).min(1, 'At least one item is required'),
  receivedAmountPaise: paiseAmount().default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  notes: z.string().max(500).optional().default(''),
  date: dateString().optional(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
