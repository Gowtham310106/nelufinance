// src/features/payments/payment.routes.ts
import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createPaymentSchema } from './payment.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createPaymentSchema }),
  paymentController.create.bind(paymentController)
);

router.get('/', paymentController.getAll.bind(paymentController));

export default router;
