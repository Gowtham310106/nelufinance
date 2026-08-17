// src/features/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.register(req.body);

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            phone: user.phone,
            name: user.name,
            role: user.role,
            language: user.language,
            businessId: user.businessId,
          },
          token,
        },
        'Registration successful',
        201,
      );
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.login(req.body);

      sendSuccess(res, {
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          language: user.language,
          businessId: user.businessId,
        },
        token,
      });
    } catch (error: any) {
      if (error.status) {
        sendError(res, error.message, error.status);
        return;
      }
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const user = await authService.getProfile(req.user.userId);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        language: user.language,
        businessId: user.businessId,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
