// src/features/seed/seed.routes.ts
import { Router } from 'express';
import { seedController } from './seed.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBusiness } from '../../middleware/business-isolation.middleware';

const router = Router();

router.use(authenticate);
router.use(requireBusiness);

router.post('/demo', seedController.populateDemo.bind(seedController));

export default router;
