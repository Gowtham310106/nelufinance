// src/features/inventory/inventory.routes.ts
import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { stockAdjustmentSchema } from './inventory.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.get('/', inventoryController.getStockOverview.bind(inventoryController));
router.get('/movements', inventoryController.getMovements.bind(inventoryController));
router.post(
  '/adjustments',
  validate({ body: stockAdjustmentSchema }),
  inventoryController.adjustStock.bind(inventoryController)
);

export default router;
