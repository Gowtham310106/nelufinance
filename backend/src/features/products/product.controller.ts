// src/features/products/product.controller.ts
import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class ProductController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const product = await productService.create(businessId, userId, req.body);
      sendSuccess(res, product, 'Product created successfully', 201);
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
      const { search, category, activeOnly } = req.query;
      const products = await productService.getAll(businessId, {
        search: search as string,
        category: category as string,
        activeOnly: activeOnly !== 'false',
      });
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const product = await productService.getById(businessId, req.params.id as string);
      if (!product) {
        sendError(res, 'Product not found', 404);
        return;
      }
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const product = await productService.update(
        businessId,
        userId,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const userId = req.user!.userId;
      const deleted = await productService.delete(businessId, userId, req.params.id as string);
      if (!deleted) {
        sendError(res, 'Product not found', 404);
        return;
      }
      sendSuccess(res, null, 'Product deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
