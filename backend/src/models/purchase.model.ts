// src/models/purchase.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod, WeightUnit, PAYMENT_METHODS, WEIGHT_UNITS } from '../config/constants';

export interface IPurchaseItem {
  productId: Types.ObjectId;
  productName: string;
  inputUnit: WeightUnit;
  inputQuantity: number;
  quantityKg: number;
  ratePaisePerKg: number;
  totalAmountPaise: number;
}

export interface IPurchase extends Document {
  businessId: Types.ObjectId;
  transactionNumber: string; // e.g. PUR-20260817-0001
  supplierId?: Types.ObjectId;
  supplierName?: string;
  items: IPurchaseItem[];
  totalAmountPaise: number;
  paidAmountPaise: number;
  pendingAmountPaise: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  employeeId?: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    inputUnit: { type: String, enum: WEIGHT_UNITS, default: 'kg' },
    inputQuantity: { type: Number, required: true },
    quantityKg: { type: Number, required: true },
    ratePaisePerKg: { type: Number, required: true },
    totalAmountPaise: { type: Number, required: true },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    transactionNumber: { type: String, required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String },
    items: [PurchaseItemSchema],
    totalAmountPaise: { type: Number, required: true },
    paidAmountPaise: { type: Number, default: 0 },
    pendingAmountPaise: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    notes: { type: String },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

PurchaseSchema.index({ businessId: 1, date: -1 });

export const Purchase = model<IPurchase>('Purchase', PurchaseSchema);
