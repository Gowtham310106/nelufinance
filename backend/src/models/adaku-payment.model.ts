// src/models/adaku-payment.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod, PAYMENT_METHODS } from '../config/constants';

export type AdakuPaymentType = 'INTEREST_ONLY' | 'PRINCIPAL_REDUCTION' | 'FULL_REDEMPTION';

export interface IAdakuPayment extends Document {
  businessId: Types.ObjectId;
  receiptNumber: string; // e.g. ADR-20260817-0001
  adakuId: Types.ObjectId;
  pledgeNumber: string;
  customerName: string;
  type: AdakuPaymentType;
  interestAmountPaise: number;
  principalAmountPaise: number;
  totalPaidPaise: number;
  monthsCovered?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: Date;
  recordedBy?: Types.ObjectId;
  createdAt: Date;
}

const AdakuPaymentSchema = new Schema<IAdakuPayment>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    receiptNumber: { type: String, required: true, index: true },
    adakuId: { type: Schema.Types.ObjectId, ref: 'AdakuKadan', required: true, index: true },
    pledgeNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    type: {
      type: String,
      enum: ['INTEREST_ONLY', 'PRINCIPAL_REDUCTION', 'FULL_REDEMPTION'],
      required: true,
    },
    interestAmountPaise: { type: Number, default: 0 },
    principalAmountPaise: { type: Number, default: 0 },
    totalPaidPaise: { type: Number, required: true },
    monthsCovered: { type: Number },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    notes: { type: String },
    date: { type: Date, default: Date.now, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AdakuPaymentSchema.index({ businessId: 1, adakuId: 1, date: -1 });

export const AdakuPayment = model<IAdakuPayment>('AdakuPayment', AdakuPaymentSchema);
