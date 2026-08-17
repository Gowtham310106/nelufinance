// src/features/seed/seed.controller.ts
import { Request, Response, NextFunction } from 'express';
import { seedService } from './seed.service';
import { sendSuccess } from '../../utils/api-response';

export class SeedController {
  async populateDemo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const result = await seedService.populateDemoData(businessId, userId);
      sendSuccess(res, result, 'Demo data populated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const seedController = new SeedController();
