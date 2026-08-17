// src/features/expenses/expense.routes.ts
import { Router } from 'express';
import { expenseController } from './expense.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { createExpenseSchema } from './expense.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createExpenseSchema }),
  expenseController.create.bind(expenseController)
);

router.get('/', expenseController.getAll.bind(expenseController));
router.delete('/:id', expenseController.delete.bind(expenseController));

export default router;
