// src/models/weight-reconciliation.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export type WeightReconciliationAction =
  | 'ACCEPT_WEIGHBRIDGE'
  | 'ACCEPT_BAG_COUNT'
  | 'SPLIT_DIFFERENCE'
  | 'DISPUTED';

export interface IWeightReconciliation extends Document {
  businessId: Types.ObjectId;
  transactionNumber: string; // e.g. WRC-20260817-0001
  lorryNumber: string;       // e.g. TN-25-AB-1234
  driverName?: string;
  driverPhone?: string;
  supplierId?: Types.ObjectId;
  supplierName?: string;
  productId: Types.ObjectId;
  productName: string;
  grossWeightKg: number;      // Loaded truck
  tareWeightKg: number;       // Empty truck
  netWeighbridgeWeightKg: number; // gross - tare
  bagCount: number;
  bagStandardWeightKg: number; // e.g. 75
  bagCalculatedWeightKg: number;  // bagCount * bagStandardWeightKg
  discrepancyKg: number;      // netWeighbridge - bagCalculated
  discrepancyPercentage: number;
  actionTaken: WeightReconciliationAction;
  finalAcceptedWeightKg: number;
  notes?: string;
  employeeId?: Types.ObjectId;
  date: Date;
  createdAt: Date;
}

const WeightReconciliationSchema = new Schema<IWeightReconciliation>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    transactionNumber: { type: String, required: true, index: true },
    lorryNumber: { type: String, required: true, trim: true },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    grossWeightKg: { type: Number, required: true },
    tareWeightKg: { type: Number, required: true },
    netWeighbridgeWeightKg: { type: Number, required: true },
    bagCount: { type: Number, required: true },
    bagStandardWeightKg: { type: Number, default: 75 },
    bagCalculatedWeightKg: { type: Number, required: true },
    discrepancyKg: { type: Number, required: true },
    discrepancyPercentage: { type: Number, required: true },
    actionTaken: {
      type: String,
      enum: ['ACCEPT_WEIGHBRIDGE', 'ACCEPT_BAG_COUNT', 'SPLIT_DIFFERENCE', 'DISPUTED'],
      default: 'ACCEPT_WEIGHBRIDGE',
    },
    finalAcceptedWeightKg: { type: Number, required: true },
    notes: { type: String },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

WeightReconciliationSchema.index({ businessId: 1, date: -1 });

export const WeightReconciliation = model<IWeightReconciliation>(
  'WeightReconciliation',
  WeightReconciliationSchema
);
