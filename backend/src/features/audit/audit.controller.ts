// src/features/audit/audit.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuditLog } from '../../models/audit-log.model';
import { sendSuccess } from '../../utils/api-response';

const MAX_LIMIT = 200;

export class AuditController {
  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = (req as any).businessId;
      const { entityType, action, limit = '50', page = '1' } = req.query;

      const filter: any = { businessId: new Types.ObjectId(businessId) };
      if (entityType && entityType !== 'all') {
        filter.entityType = String(entityType);
      }
      if (action && action !== 'all') {
        filter.action = String(action);
      }

      const l = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), MAX_LIMIT);
      const p = Math.max(parseInt(page as string, 10) || 1, 1);
      const skip = (p - 1) * l;

      const total = await AuditLog.countDocuments(filter);
      const logs = await AuditLog.find(filter)
        .populate('userId', 'name phone role')
        .sort({ createdAt: -1, _id: -1 })
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
