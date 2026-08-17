// src/features/weight-reconciliation/weight-reconciliation.routes.ts
import { Router } from 'express';
import { weightReconciliationController } from './weight-reconciliation.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createWeightReconciliationSchema } from './weight-reconciliation.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createWeightReconciliationSchema }),
  weightReconciliationController.create.bind(weightReconciliationController)
);

router.get('/', weightReconciliationController.getAll.bind(weightReconciliationController));

export default router;
