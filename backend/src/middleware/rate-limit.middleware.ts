// src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

/** General API rate limit: 200 requests per 15 minutes */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

/** Auth endpoints: 30 attempts per 15 minutes to prevent brute force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'Too many login attempts. Please try again later.' },
});
