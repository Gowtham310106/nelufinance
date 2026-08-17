// src/features/customers/customer.controller.ts
import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const customer = await customerService.create(businessId, userId, req.body);
      sendSuccess(res, customer, 'Customer created successfully', 201);
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
      const { search } = req.query;
      const customers = await customerService.getAll(businessId, search as string);
      sendSuccess(res, customers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const customer = await customerService.getById(businessId, req.params.id as string);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const customer = await customerService.update(
        businessId,
        userId,
        req.params.id as string,
        req.body
      );
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }
      sendSuccess(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const ledger = await customerService.getLedger(businessId, req.params.id as string);
      sendSuccess(res, ledger);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }

  async getVatti(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { rate, asOfDate } = req.query;
      const parsedRate = rate ? parseFloat(rate as string) : 2.0;
      const vatti = await customerService.calculateVatti(
        businessId,
        req.params.id as string,
        parsedRate,
        asOfDate as string
      );
      sendSuccess(res, vatti);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }
}

export const customerController = new CustomerController();
