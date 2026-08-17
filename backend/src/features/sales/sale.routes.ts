// src/features/sales/sale.routes.ts
import { Router } from 'express';
import { saleController } from './sale.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createSaleSchema } from './sale.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createSaleSchema }),
  saleController.create.bind(saleController)
);

router.get('/', saleController.getAll.bind(saleController));
router.get('/:id', saleController.getById.bind(saleController));

export default router;
