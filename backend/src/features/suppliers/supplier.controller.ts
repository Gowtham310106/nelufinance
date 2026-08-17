// src/features/suppliers/supplier.controller.ts
import { Request, Response, NextFunction } from 'express';
import { supplierService } from './supplier.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class SupplierController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const supplier = await supplierService.create(businessId, userId, req.body);
      sendSuccess(res, supplier, 'Supplier created successfully', 201);
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
      const suppliers = await supplierService.getAll(businessId, search as string);
      sendSuccess(res, suppliers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const supplier = await supplierService.getById(businessId, req.params.id as string);
      if (!supplier) {
        sendError(res, 'Supplier not found', 404);
        return;
      }
      sendSuccess(res, supplier);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const supplier = await supplierService.update(
        businessId,
        userId,
        req.params.id as string,
        req.body
      );
      if (!supplier) {
        sendError(res, 'Supplier not found', 404);
        return;
      }
      sendSuccess(res, supplier, 'Supplier updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const supplierController = new SupplierController();
