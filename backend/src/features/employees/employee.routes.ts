// src/features/employees/employee.routes.ts
import { Router } from 'express';
import { employeeController } from './employee.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  recordEmployeeTransactionSchema,
} from './employee.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post(
  '/',
  validate({ body: createEmployeeSchema }),
  employeeController.create.bind(employeeController)
);

router.get('/', employeeController.getAll.bind(employeeController));
router.get('/:id', employeeController.getById.bind(employeeController));

router.put(
  '/:id',
  validate({ body: updateEmployeeSchema }),
  employeeController.update.bind(employeeController)
);

router.post(
  '/:id/transactions',
  validate({ body: recordEmployeeTransactionSchema }),
  employeeController.recordTransaction.bind(employeeController)
);

export default router;
