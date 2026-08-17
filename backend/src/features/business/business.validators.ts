// src/features/business/business.validators.ts
import { z } from 'zod';

export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(200).trim(),
  nameTamil: z.string().max(200).trim().default(''),
  address: z.string().max(500).trim().default(''),
  phone: z.string().min(10).max(13).regex(/^[+]?[0-9]+$/, 'Invalid phone number'),
  gstNumber: z.string().max(20).trim().optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  nameTamil: z.string().max(200).trim().optional(),
  address: z.string().max(500).trim().optional(),
  phone: z.string().min(10).max(13).optional(),
  gstNumber: z.string().max(20).trim().optional(),
  settings: z
    .object({
      defaultUnit: z.enum(['kg', 'quintal', 'tonne', 'bag']).optional(),
      decimalPrecision: z.number().min(0).max(4).optional(),
      lowStockThresholdKg: z.number().min(0).optional(),
      allowNegativeStock: z.boolean().optional(),
      interestConfig: z
        .object({
          defaultType: z.enum(['monthly_percentage', 'annual', 'daily', 'fixed']).optional(),
          defaultRate: z.number().min(0).max(100).optional(),
        })
        .optional(),
      reconciliationThresholds: z
        .object({
          matchKg: z.number().min(0).optional(),
          minorKg: z.number().min(0).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
