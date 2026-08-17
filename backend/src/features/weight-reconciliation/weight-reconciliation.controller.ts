// src/features/weight-reconciliation/weight-reconciliation.controller.ts
import { Request, Response, NextFunction } from 'express';
import { weightReconciliationService } from './weight-reconciliation.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class WeightReconciliationController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const record = await weightReconciliationService.create(businessId, userId, req.body);
      sendSuccess(res, record, 'Weight reconciliation recorded successfully', 201);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const records = await weightReconciliationService.getAll(businessId);
      sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  }
}

export const weightReconciliationController = new WeightReconciliationController();
