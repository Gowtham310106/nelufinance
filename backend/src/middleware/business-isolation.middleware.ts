// src/middleware/business-isolation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/api-response';

/**
 * Ensures the authenticated user has a businessId and attaches it to the request.
 * All downstream queries should filter by req.businessId for data isolation.
 */
export function requireBusiness(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (!req.user.businessId) {
    sendError(res, 'No business associated with this account. Please complete onboarding.', 403);
    return;
  }

  // Attach businessId at top level for easy access
  (req as any).businessId = req.user.businessId;
  next();
}
