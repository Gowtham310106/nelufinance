// src/features/employees/employee.controller.ts
import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class EmployeeController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const employee = await employeeService.create(businessId, userId, req.body);
      sendSuccess(res, employee, 'Employee created successfully', 201);
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
      const employees = await employeeService.getAll(businessId);
      sendSuccess(res, employees);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const result = await employeeService.getById(businessId, req.params.id as string);
      if (!result) {
        sendError(res, 'Employee not found', 404);
        return;
      }
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const updated = await employeeService.update(
        businessId,
        userId,
        req.params.id as string,
        req.body
      );
      if (!updated) {
        sendError(res, 'Employee not found', 404);
        return;
      }
      sendSuccess(res, updated, 'Employee updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async recordTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const txn = await employeeService.recordTransaction(
        businessId,
        userId,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, txn, 'Transaction recorded successfully', 201);
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }
}

export const employeeController = new EmployeeController();
