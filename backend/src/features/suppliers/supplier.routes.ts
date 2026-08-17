// src/features/suppliers/supplier.routes.ts
import { Router } from 'express';
import { supplierController } from './supplier.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createSupplierSchema, updateSupplierSchema } from './supplier.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createSupplierSchema }),
  supplierController.create.bind(supplierController)
);

router.get('/', supplierController.getAll.bind(supplierController));
router.get('/:id', supplierController.getById.bind(supplierController));

router.put(
  '/:id',
  validate({ body: updateSupplierSchema }),
  supplierController.update.bind(supplierController)
);

export default router;
