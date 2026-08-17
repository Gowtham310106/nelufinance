// src/features/adaku/adaku.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { adakuController } from './adaku.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max before compression
    files: 5, // Up to 5 photos
  },
});

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.get('/summary', adakuController.getSummary.bind(adakuController));
router.get('/', adakuController.getAll.bind(adakuController));
router.get('/:id', adakuController.getById.bind(adakuController));
router.get('/:id/vatti', adakuController.calculateInterest.bind(adakuController));

router.post(
  '/',
  upload.array('images', 5),
  adakuController.create.bind(adakuController)
);

router.post(
  '/:id/payments',
  adakuController.recordPayment.bind(adakuController)
);

export default router;
