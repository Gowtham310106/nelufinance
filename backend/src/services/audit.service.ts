// src/services/audit.service.ts
import { Types } from 'mongoose';
import { AuditLog } from '../models/audit-log.model';

interface AuditEntry {
  businessId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: { field: string; oldValue: unknown; newValue: unknown }[];
  reason?: string;
  ipAddress?: string;
}

/**
 * Creates an immutable audit log entry.
 * Fire-and-forget — errors are logged but don't break the main flow.
 */
export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({
      businessId: new Types.ObjectId(entry.businessId),
      userId: new Types.ObjectId(entry.userId),
      action: entry.action,
      entityType: entry.entityType,
      entityId: new Types.ObjectId(entry.entityId),
      changes: entry.changes,
      reason: entry.reason,
      ipAddress: entry.ipAddress,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
