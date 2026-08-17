// src/features/expenses/expense.controller.ts
import { Request, Response, NextFunction } from 'express';
import { expenseService } from './expense.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class ExpenseController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const expense = await expenseService.create(businessId, userId, req.body);
      sendSuccess(res, expense, 'Expense recorded successfully', 201);
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
      const { category, startDate, endDate } = req.query;
      const expenses = await expenseService.getAll(businessId, {
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      sendSuccess(res, expenses);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const deleted = await expenseService.delete(businessId, userId, req.params.id as string);
      if (!deleted) {
        sendError(res, 'Expense not found', 404);
        return;
      }
      sendSuccess(res, null, 'Expense deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
