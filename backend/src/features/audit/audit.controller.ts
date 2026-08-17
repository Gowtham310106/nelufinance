// src/features/audit/audit.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuditLog } from '../../models/audit-log.model';
import { sendSuccess } from '../../utils/api-response';

export class AuditController {
  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { entityType, action, limit = '50', page = '1' } = req.query;

      const filter: any = { businessId: new Types.ObjectId(businessId) };
      if (entityType && entityType !== 'all') {
        filter.entityType = entityType;
      }
      if (action && action !== 'all') {
        filter.action = action;
      }

      const l = parseInt(limit as string, 10) || 50;
      const p = parseInt(page as string, 10) || 1;
      const skip = (p - 1) * l;

      const total = await AuditLog.countDocuments(filter);
      const logs = await AuditLog.find(filter)
        .populate('userId', 'name phone role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(l);

      sendSuccess(res, {
        logs,
        pagination: {
          total,
          page: p,
          limit: l,
          pages: Math.ceil(total / l),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
