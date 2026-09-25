// src/features/customers/customer.validators.ts
import { z } from 'zod';
import { paiseAmount } from '../../utils/validation';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100).trim(),
  phone: z.string().min(10, 'Valid phone number is required').max(15).trim(),
  address: z.string().max(300).trim().optional().default(''),
  openingBalancePaise: paiseAmount().optional().default(0),
  interestRate: z.number().min(0).max(100).optional().default(0),
  notes: z.string().max(500).trim().optional().default(''),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().min(10).max(15).trim().optional(),
  address: z.string().max(300).trim().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).trim().optional(),
  active: z.boolean().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
