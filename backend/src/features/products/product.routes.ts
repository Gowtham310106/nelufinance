// src/features/products/product.routes.ts
import { Router } from 'express';
import { productController } from './product.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createProductSchema, updateProductSchema } from './product.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createProductSchema }),
  productController.create.bind(productController)
);

router.get('/', productController.getAll.bind(productController));
router.get('/:id', productController.getById.bind(productController));

router.put(
  '/:id',
  validate({ body: updateProductSchema }),
  productController.update.bind(productController)
);

router.delete('/:id', productController.delete.bind(productController));

export default router;
