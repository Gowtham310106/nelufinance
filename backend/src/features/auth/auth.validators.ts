// src/features/auth/auth.validators.ts
import { z } from 'zod';

export const registerSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(13, 'Phone number too long')
    .regex(/^[+]?[0-9]+$/, 'Invalid phone number'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim(),
  language: z.enum(['en', 'ta']).default('en'),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(13, 'Phone number too long'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
