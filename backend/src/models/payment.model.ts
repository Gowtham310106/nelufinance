// src/models/payment.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod, PAYMENT_METHODS } from '../config/constants';

export type PaymentType = 'RECEIVED' | 'GIVEN';
export type PartyType = 'CUSTOMER' | 'SUPPLIER';

export interface IPayment extends Document {
  businessId: Types.ObjectId;
  transactionNumber: string; // e.g. PAY-20260817-0001
  type: PaymentType;
  partyType: PartyType;
  partyId: Types.ObjectId;
  partyName: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string; // UPI txn id, cheque number, etc.
  notes?: string;
  employeeId?: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    transactionNumber: { type: String, required: true, index: true },
    type: { type: String, enum: ['RECEIVED', 'GIVEN'], required: true },
    partyType: { type: String, enum: ['CUSTOMER', 'SUPPLIER'], required: true },
    partyId: { type: Schema.Types.ObjectId, required: true, index: true },
    partyName: { type: String, required: true },
    amountPaise: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    referenceNumber: { type: String },
    notes: { type: String },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ businessId: 1, date: -1 });
PaymentSchema.index({ businessId: 1, partyType: 1, partyId: 1, date: -1 });

export const Payment = model<IPayment>('Payment', PaymentSchema);
