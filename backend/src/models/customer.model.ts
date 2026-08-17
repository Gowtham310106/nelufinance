// src/models/customer.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  businessId: Types.ObjectId;
  name: string;
  phone: string;
  address?: string;
  openingBalancePaise: number; // Initial credit balance in paise
  currentBalancePaise: number; // Current outstanding credit balance in paise
  interestRate?: number;       // e.g. 2% monthly interest
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    openingBalancePaise: { type: Number, default: 0 },
    currentBalancePaise: { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CustomerSchema.index({ businessId: 1, phone: 1 });
CustomerSchema.index({ businessId: 1, active: 1 });
CustomerSchema.index({ businessId: 1, currentBalancePaise: -1 });

export const Customer = model<ICustomer>('Customer', CustomerSchema);
