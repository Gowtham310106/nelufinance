// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Secrets must come from the environment — never from source control.
// Local development gets harmless defaults; production fails fast if they are missing.
const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGODB_URI: isProduction
    ? z.string({ error: 'MONGODB_URI environment variable is required' }).min(1)
    : z.string().default('mongodb://127.0.0.1:27017/vetrinel'),
  JWT_SECRET: isProduction
    ? z
        .string({ error: 'JWT_SECRET environment variable is required' })
        .min(32, 'JWT_SECRET must be at least 32 characters')
    : z.string().default('dev-only-insecure-jwt-secret-change-me-please'),
  ENABLE_DEMO_SEED: z.string().optional(),
});

export const env = envSchema.parse(process.env);
