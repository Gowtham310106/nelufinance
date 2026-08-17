// src/features/inventory/inventory.controller.ts
import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class InventoryController {
  async getStockOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const overview = await inventoryService.getStockOverview(businessId);
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  }

  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { productId, type, startDate, endDate, limit } = req.query;
      const movements = await inventoryService.getMovements(businessId, {
        productId: productId as string,
        type: type as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      sendSuccess(res, movements);
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const result = await inventoryService.adjustStock(businessId, userId, req.body);
      sendSuccess(res, result, 'Stock adjusted successfully');
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
