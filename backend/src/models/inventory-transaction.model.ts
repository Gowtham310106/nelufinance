// src/models/inventory-transaction.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export type InventoryMovementType =
  | 'PURCHASE_IN'
  | 'SALE_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RETURN_IN'
  | 'RETURN_OUT';

export interface IInventoryTransaction extends Document {
  businessId: Types.ObjectId;
  productId: Types.ObjectId;
  type: InventoryMovementType;
  quantityKg: number;
  balanceAfterKg: number;
  unitRatePaise?: number;
  referenceType?: 'Purchase' | 'Sale' | 'ManualAdjustment' | 'WeightReconciliation';
  referenceId?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  reason?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: ['PURCHASE_IN', 'SALE_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN_IN', 'RETURN_OUT'],
      required: true,
    },
    quantityKg: { type: Number, required: true },
    balanceAfterKg: { type: Number, required: true },
    unitRatePaise: { type: Number },
    referenceType: { type: String, enum: ['Purchase', 'Sale', 'ManualAdjustment', 'WeightReconciliation'] },
    referenceId: { type: Schema.Types.ObjectId },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    notes: { type: String },
    date: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable ledger
  }
);

InventoryTransactionSchema.index({ businessId: 1, productId: 1, date: -1 });
InventoryTransactionSchema.index({ businessId: 1, date: -1 });

export const InventoryTransaction = model<IInventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema
);
