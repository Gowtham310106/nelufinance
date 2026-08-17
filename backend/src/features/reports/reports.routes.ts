// src/features/reports/reports.routes.ts
import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.get('/profit', reportsController.getProfitLoss.bind(reportsController));
router.get('/sales', reportsController.getSalesAnalytics.bind(reportsController));

export default router;
