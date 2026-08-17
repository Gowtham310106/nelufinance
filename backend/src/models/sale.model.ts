// src/models/sale.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod, WeightUnit, PAYMENT_METHODS, WEIGHT_UNITS } from '../config/constants';

export interface ISaleItem {
  productId: Types.ObjectId;
  productName: string;
  inputUnit: WeightUnit;
  inputQuantity: number;
  quantityKg: number;
  ratePaisePerKg: number;
  totalAmountPaise: number;
  costPaisePerKgSnapshot: number; // WAC at the exact time of sale
  totalCostPaise: number;          // quantityKg * costPaisePerKgSnapshot
}

export interface ISale extends Document {
  businessId: Types.ObjectId;
  transactionNumber: string; // e.g. SAL-20260817-0001
  customerId?: Types.ObjectId;
  customerName?: string;
  items: ISaleItem[];
  totalAmountPaise: number;
  receivedAmountPaise: number;
  creditAmountPaise: number;
  totalCostPaise: number;
  grossProfitPaise: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  employeeId?: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    inputUnit: { type: String, enum: WEIGHT_UNITS, default: 'kg' },
    inputQuantity: { type: Number, required: true },
    quantityKg: { type: Number, required: true },
    ratePaisePerKg: { type: Number, required: true },
    totalAmountPaise: { type: Number, required: true },
    costPaisePerKgSnapshot: { type: Number, default: 0 },
    totalCostPaise: { type: Number, default: 0 },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    transactionNumber: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    items: [SaleItemSchema],
    totalAmountPaise: { type: Number, required: true },
    receivedAmountPaise: { type: Number, default: 0 },
    creditAmountPaise: { type: Number, default: 0 },
    totalCostPaise: { type: Number, default: 0 },
    grossProfitPaise: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    notes: { type: String },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

SaleSchema.index({ businessId: 1, date: -1 });
SaleSchema.index({ businessId: 1, customerId: 1, date: -1 });

export const Sale = model<ISale>('Sale', SaleSchema);
