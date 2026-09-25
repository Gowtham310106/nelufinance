// src/features/adaku/adaku.controller.ts
import { Request, Response, NextFunction } from 'express';
import { adakuService } from './adaku.service';
import { sendSuccess, sendError } from '../../utils/api-response';
import { createAdakuSchema } from './adaku.validators';

export class AdakuController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;

      // Parse JSON body fields if sent as multipart form-data
      let body: any;
      try {
        body = typeof req.body?.data === 'string' ? JSON.parse(req.body.data) : { ...(req.body ?? {}) };
      } catch {
        sendError(res, 'Malformed JSON in "data" field', 400);
        return;
      }
      if (!body || typeof body !== 'object') {
        sendError(res, 'Request body is required', 400);
        return;
      }
      // Also coerce numerical fields if passed directly as form fields
      const numericFields = [
        'grossWeightGrams',
        'stoneWeightGrams',
        'netWeightGrams',
        'monthlyVattiRate',
        'loanAmountPaise',
        'marketValuePaise',
        'itemCount',
      ];
      for (const key of numericFields) {
        if (typeof body[key] === 'string' && body[key].trim() !== '') body[key] = Number(body[key]);
      }

      // Validate before any image is processed/uploaded so a bad request leaves no orphaned files
      const parsed = createAdakuSchema.safeParse(body);
      if (!parsed.success) {
        const messages = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
        sendError(res, messages.join('; '), 422);
        return;
      }

      const files = req.files as Express.Multer.File[] | undefined;
      const adaku = await adakuService.create(businessId, userId, parsed.data, files);

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
