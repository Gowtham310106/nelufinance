// src/features/dashboard/dashboard.controller.ts
import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/api-response';

export class DashboardController {
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const metrics = await dashboardService.getMetrics(businessId);
      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
