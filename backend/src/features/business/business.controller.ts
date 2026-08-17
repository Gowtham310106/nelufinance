// src/features/business/business.controller.ts
import { Request, Response, NextFunction } from 'express';
import { businessService } from './business.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class BusinessController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const business = await businessService.create(req.user.userId, req.body);

      sendSuccess(res, business, 'Business created successfully', 201);
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
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const businesses = await businessService.getByOwner(req.user.userId);
      sendSuccess(res, businesses);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const business = await businessService.getById(req.params.id as string, req.user.userId);
      if (!business) {
        sendError(res, 'Business not found', 404);
        return;
      }

      sendSuccess(res, business);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const business = await businessService.update(
        req.params.id as string,
        req.user.userId,
        req.body,
      );

      sendSuccess(res, business, 'Business updated successfully');
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }
}

export const businessController = new BusinessController();
