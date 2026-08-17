// src/features/purchases/purchase.controller.ts
import { Request, Response, NextFunction } from 'express';
import { purchaseService } from './purchase.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class PurchaseController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const purchase = await purchaseService.create(businessId, userId, req.body);
      sendSuccess(res, purchase, 'Purchase recorded successfully', 201);
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
      const { startDate, endDate, supplierId } = req.query;
      const purchases = await purchaseService.getAll(businessId, {
        startDate: startDate as string,
        endDate: endDate as string,
        supplierId: supplierId as string,
      });
      sendSuccess(res, purchases);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const purchase = await purchaseService.getById(businessId, req.params.id as string);
      if (!purchase) {
        sendError(res, 'Purchase not found', 404);
        return;
      }
      sendSuccess(res, purchase);
    } catch (error) {
      next(error);
    }
  }
}

export const purchaseController = new PurchaseController();
