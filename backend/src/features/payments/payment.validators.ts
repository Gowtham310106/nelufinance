// src/features/payments/payment.validators.ts
import { z } from 'zod';
import { objectIdString, paiseAmount, dateString } from '../../utils/validation';
import { PAYMENT_METHODS } from '../../config/constants';

export const createPaymentSchema = z.object({
  type: z.enum(['RECEIVED', 'GIVEN']),
  partyType: z.enum(['CUSTOMER', 'SUPPLIER']),
  partyId: objectIdString('party'),
  amountPaise: paiseAmount().refine((v) => v > 0, 'Payment amount must be greater than 0'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  referenceNumber: z.string().max(100).optional().default(''),
  notes: z.string().max(500).optional().default(''),
  date: dateString().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
