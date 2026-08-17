// src/features/adaku/adaku.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adakuService } from './adaku.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AdakuController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;

      // Parse JSON body fields if sent as multipart form-data
      const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
      // Also coerce numerical fields if passed directly as form fields
      if (typeof body.grossWeightGrams === 'string') body.grossWeightGrams = parseFloat(body.grossWeightGrams);
      if (typeof body.stoneWeightGrams === 'string') body.stoneWeightGrams = parseFloat(body.stoneWeightGrams);
      if (typeof body.netWeightGrams === 'string') body.netWeightGrams = parseFloat(body.netWeightGrams);
      if (typeof body.loanAmountPaise === 'string') body.loanAmountPaise = parseInt(body.loanAmountPaise, 10);
      if (typeof body.marketValuePaise === 'string') body.marketValuePaise = parseInt(body.marketValuePaise, 10);
      if (typeof body.monthlyVattiRate === 'string') body.monthlyVattiRate = parseFloat(body.monthlyVattiRate);
      if (typeof body.itemCount === 'string') body.itemCount = parseInt(body.itemCount, 10);

      const files = req.files as Express.Multer.File[] | undefined;
      const adaku = await adakuService.create(businessId, userId, body, files);

      sendSuccess(res, adaku, 'Pawn pledge loan created successfully', 201);
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
      const { status, search } = req.query;
      const pledges = await adakuService.getAll(businessId, {
        status: status as string,
        search: search as string,
      });
      sendSuccess(res, pledges);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const result = await adakuService.getById(businessId, req.params.id as string);
      if (!result) {
        sendError(res, 'Pledge record not found', 404);
        return;
      }
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async calculateInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { asOfDate } = req.query;
      const result = await adakuService.calculateInterest(
        businessId,
        req.params.id as string,
        asOfDate as string
      );
      sendSuccess(res, result);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const payment = await adakuService.recordPayment(
        businessId,
        userId,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, payment, 'Payment recorded successfully', 201);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const summary = await adakuService.getSummary(businessId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const adakuController = new AdakuController();
