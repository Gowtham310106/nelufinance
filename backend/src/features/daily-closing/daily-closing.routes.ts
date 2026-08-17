// src/features/daily-closing/daily-closing.routes.ts
import { Router } from 'express';
import { dailyClosingController } from './daily-closing.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';
import { submitDailyClosingSchema } from './daily-closing.validators';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.get('/preview', dailyClosingController.getPreview.bind(dailyClosingController));
router.get('/history', dailyClosingController.getHistory.bind(dailyClosingController));
router.post(
  '/close',
  validate({ body: submitDailyClosingSchema }),
  dailyClosingController.submitClosing.bind(dailyClosingController)
);

export default router;
