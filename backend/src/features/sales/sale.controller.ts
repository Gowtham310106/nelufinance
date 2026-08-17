// src/features/sales/sale.controller.ts
import { Request, Response, NextFunction } from 'express';
import { saleService } from './sale.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class SaleController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const sale = await saleService.create(businessId, userId, req.body);
      sendSuccess(res, sale, 'Sale recorded successfully', 201);
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
      const { startDate, endDate, customerId } = req.query;
      const sales = await saleService.getAll(businessId, {
        startDate: startDate as string,
        endDate: endDate as string,
        customerId: customerId as string,
      });
      sendSuccess(res, sales);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const sale = await saleService.getById(businessId, req.params.id as string);
      if (!sale) {
        sendError(res, 'Sale not found', 404);
        return;
      }
      sendSuccess(res, sale);
    } catch (error) {
      next(error);
    }
  }
}

export const saleController = new SaleController();
