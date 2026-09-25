// src/features/daily-closing/daily-closing.controller.ts
import { Request, Response, NextFunction } from 'express';
import { dailyClosingService } from './daily-closing.service';
import { sendSuccess } from '../../utils/api-response';

export class DailyClosingController {
  async getPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { date } = req.query;
      const preview = await dailyClosingService.getPreview(businessId, date as string);
      sendSuccess(res, preview);
    } catch (error) {
      next(error);
    }
  }

  async submitClosing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const closing = await dailyClosingService.submitClosing(
        businessId,
        userId,
        req.user!.role,
        req.body
      );
      sendSuccess(res, closing, 'Daily closing saved successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const history = await dailyClosingService.getHistory(businessId);
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }
}

export const dailyClosingController = new DailyClosingController();
