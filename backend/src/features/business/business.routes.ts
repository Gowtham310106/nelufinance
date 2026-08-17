// src/features/business/business.routes.ts
import { Router } from 'express';
import { businessController } from './business.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { createBusinessSchema, updateBusinessSchema } from './business.validators';

const router = Router();

// All business routes require authentication
router.use(authenticate);

// POST /api/business — create a new business
router.post(
  '/',
  validate({ body: createBusinessSchema }),
  businessController.create.bind(businessController),
);

// GET /api/business — get all businesses for the user
router.get('/', businessController.getAll.bind(businessController));

// GET /api/business/:id — get a specific business
router.get('/:id', businessController.getById.bind(businessController));

// PUT /api/business/:id — update business (owner only)
router.put(
  '/:id',
  authorize('owner'),
  validate({ body: updateBusinessSchema }),
  businessController.update.bind(businessController),
);

export default router;
