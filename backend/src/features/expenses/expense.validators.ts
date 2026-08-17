// src/features/expenses/expense.validators.ts
import { z } from 'zod';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../config/constants';

export const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amountPaise: z.number().positive('Expense amount must be greater than 0'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  notes: z.string().max(500).optional().default(''),
  date: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
