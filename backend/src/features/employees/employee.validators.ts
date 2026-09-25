// src/features/employees/employee.validators.ts
import { z } from 'zod';
import { PAYMENT_METHODS } from '../../config/constants';

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  phone: z.string().min(10, 'Valid phone number is required').max(15).trim(),
  role: z.enum(['manager', 'cashier', 'labor', 'driver', 'helper']).default('labor'),
  salaryType: z.enum(['daily', 'monthly', 'per_bag']).default('daily'),
  baseSalaryPaise: z.number().int().nonnegative().default(0),
  notes: z.string().max(500).optional().default(''),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().min(10).max(15).trim().optional(),
  role: z.enum(['manager', 'cashier', 'labor', 'driver', 'helper']).optional(),
  salaryType: z.enum(['daily', 'monthly', 'per_bag']).optional(),
  baseSalaryPaise: z.number().int().nonnegative().optional(),
  notes: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export const recordEmployeeTransactionSchema = z.object({
  type: z.enum(['ADVANCE_GIVEN', 'SALARY_PAID', 'ADVANCE_DEDUCTED']),
  amountPaise: z.number().int('Amount must be in whole paise').positive('Amount must be greater than 0'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  notes: z.string().max(500).optional().default(''),
  date: z
    .string()
    .refine((s) => !isNaN(new Date(s).getTime()), 'Invalid date')
    .optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type RecordEmployeeTransactionInput = z.infer<
  typeof recordEmployeeTransactionSchema
>;
