// src/features/products/product.validators.ts
import { z } from 'zod';
import { paiseAmount } from '../../utils/validation';
import { PRODUCT_CATEGORIES, WEIGHT_UNITS } from '../../config/constants';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100).trim(),
  nameTamil: z.string().max(100).trim().optional().default(''),
  category: z.enum(PRODUCT_CATEGORIES).default('other'),
  unit: z.enum(WEIGHT_UNITS).default('kg'),
  purchasePricePaise: paiseAmount().default(0),
  sellingPricePaise: paiseAmount().default(0),
  initialStockKg: z.number().min(0).default(0),
  minimumStockKg: z.number().min(0).default(50),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  nameTamil: z.string().max(100).trim().optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  unit: z.enum(WEIGHT_UNITS).optional(),
  purchasePricePaise: paiseAmount().optional(),
  sellingPricePaise: paiseAmount().optional(),
  minimumStockKg: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
