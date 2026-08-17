// src/features/auth/auth.routes.ts
import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limit.middleware';
import { registerSchema, loginSchema } from './auth.validators';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  authController.register.bind(authController),
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  authController.login.bind(authController),
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  authController.me.bind(authController),
);

export default router;
