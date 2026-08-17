// src/features/suppliers/supplier.validators.ts
import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100).trim(),
  phone: z.string().min(10, 'Valid phone number required').max(15).trim(),
  address: z.string().max(300).trim().optional().default(''),
  notes: z.string().max(500).trim().optional().default(''),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().min(10).max(15).trim().optional(),
  address: z.string().max(300).trim().optional(),
  notes: z.string().max(500).trim().optional(),
  active: z.boolean().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
