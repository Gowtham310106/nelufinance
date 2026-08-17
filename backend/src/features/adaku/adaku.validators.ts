// src/features/adaku/adaku.validators.ts
import { z } from 'zod';
import { PAYMENT_METHODS } from '../../config/constants';

export const createAdakuSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100).trim(),
  customerPhone: z.string().min(10, 'Valid phone number is required').max(15).trim(),
  customerAadhaar: z.string().max(30).trim().optional().default(''),
  customerAddress: z.string().max(300).trim().optional().default(''),
  itemType: z.enum(['gold', 'silver', 'brass_metal', 'other']).default('gold'),
  purityKarat: z.string().max(50).default('22K (916 KDM)'),
  itemDescription: z.string().min(1, 'Item description is required').max(250),
  itemCount: z.number().int().positive().default(1),
  grossWeightGrams: z.number().positive('Gross weight must be greater than 0'),
  stoneWeightGrams: z.number().nonnegative().default(0),
  netWeightGrams: z.number().positive('Net weight must be greater than 0'),
  marketValuePaise: z.number().nonnegative().default(0),
  loanAmountPaise: z.number().positive('Loan amount must be greater than 0'),
  monthlyVattiRate: z.number().positive().default(2.0),
  lockerNumber: z.string().max(50).optional().default(''),
  pledgeDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(500).optional().default(''),
});

export const createAdakuPaymentSchema = z.object({
  type: z.enum(['INTEREST_ONLY', 'PRINCIPAL_REDUCTION', 'FULL_REDEMPTION']),
  interestAmountPaise: z.number().nonnegative().default(0),
  principalAmountPaise: z.number().nonnegative().default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  monthsCovered: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional().default(''),
  date: z.string().optional(),
});

export type CreateAdakuInput = z.infer<typeof createAdakuSchema>;
export type CreateAdakuPaymentInput = z.infer<typeof createAdakuPaymentSchema>;
