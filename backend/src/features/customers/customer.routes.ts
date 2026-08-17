// src/features/customers/customer.routes.ts
import { Router } from 'express';
import { customerController } from './customer.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createCustomerSchema, updateCustomerSchema } from './customer.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createCustomerSchema }),
  customerController.create.bind(customerController)
);

router.get('/', customerController.getAll.bind(customerController));
router.get('/:id', customerController.getById.bind(customerController));
router.get('/:id/ledger', customerController.getLedger.bind(customerController));
router.get('/:id/vatti', customerController.getVatti.bind(customerController));

router.put(
  '/:id',
  validate({ body: updateCustomerSchema }),
  customerController.update.bind(customerController)
);

export default router;
