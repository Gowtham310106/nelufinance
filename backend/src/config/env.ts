// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().default(
    process.env.MONGODB_URI ||
    'mongodb+srv://gowtham310106_db_user:deYHMuJgifSEdk1i@nelufinance.gxdk4fu.mongodb.net/vetrinel?retryWrites=true&w=majority'
  ),
  JWT_SECRET: z.string().default(
    process.env.JWT_SECRET ||
    'vetrinel_super_secure_jwt_secret_key_2026_tamilnadu_rice_trading_system'
  ),
});

export const env = envSchema.parse(process.env);
