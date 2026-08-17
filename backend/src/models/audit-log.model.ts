// src/models/audit-log.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  businessId: Types.ObjectId;
  userId: Types.ObjectId;
  action: string; // e.g., 'sale.create', 'product.update', 'inventory.adjust'
  entityType: string; // e.g., 'Sale', 'Product', 'InventoryTransaction'
  entityId: Types.ObjectId;
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  reason?: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    changes: [
      {
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
      },
    ],
    reason: String,
    ipAddress: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable — no updates
  },
);

// Compound index for querying audit logs
AuditLogSchema.index({ businessId: 1, createdAt: -1 });
AuditLogSchema.index({ businessId: 1, entityType: 1, entityId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
