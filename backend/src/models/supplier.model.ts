// src/models/supplier.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ISupplier extends Document {
  businessId: Types.ObjectId;
  name: string;
  phone: string;
  address?: string;
  currentPayablePaise: number; // Amount shop owes to supplier in paise
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    currentPayablePaise: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SupplierSchema.index({ businessId: 1, phone: 1 });
SupplierSchema.index({ businessId: 1, active: 1 });

export const Supplier = model<ISupplier>('Supplier', SupplierSchema);
