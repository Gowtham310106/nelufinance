// src/features/purchases/purchase.routes.ts
import { Router } from 'express';
import { purchaseController } from './purchase.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createPurchaseSchema } from './purchase.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createPurchaseSchema }),
  purchaseController.create.bind(purchaseController)
);

router.get('/', purchaseController.getAll.bind(purchaseController));
router.get('/:id', purchaseController.getById.bind(purchaseController));

export default router;
