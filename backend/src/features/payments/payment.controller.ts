// src/features/payments/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class PaymentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const payment = await paymentService.create(businessId, userId, req.body);
      sendSuccess(res, payment, 'Payment recorded successfully', 201);
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
      const { type, partyType, partyId, startDate, endDate } = req.query;
      const payments = await paymentService.getAll(businessId, {
        type: type as string,
        partyType: partyType as string,
        partyId: partyId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
