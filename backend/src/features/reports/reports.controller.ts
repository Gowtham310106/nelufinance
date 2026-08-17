// src/features/reports/reports.controller.ts
import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { sendSuccess } from '../../utils/api-response';

export class ReportsController {
  async getProfitLoss(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { startDate, endDate } = req.query;
      const report = await reportsService.getProfitLoss(
        businessId,
        startDate as string,
        endDate as string
      );
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getSalesAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { startDate, endDate } = req.query;
      const report = await reportsService.getSalesAnalytics(
        businessId,
        startDate as string,
        endDate as string
      );
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
