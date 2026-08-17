// src/features/dashboard/dashboard.routes.ts
import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.get('/', dashboardController.getMetrics.bind(dashboardController));

export default router;
