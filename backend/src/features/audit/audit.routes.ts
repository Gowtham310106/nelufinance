// src/features/audit/audit.routes.ts
import { Router } from 'express';
import { auditController } from './audit.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);
router.use(authorize('owner'));

router.get('/', auditController.getLogs.bind(auditController));

export default router;
