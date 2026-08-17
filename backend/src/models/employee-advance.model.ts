// src/models/employee-advance.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMethod, PAYMENT_METHODS } from '../config/constants';

export type EmployeeTransactionType = 'ADVANCE_GIVEN' | 'SALARY_PAID' | 'ADVANCE_DEDUCTED';

export interface IEmployeeAdvance extends Document {
  businessId: Types.ObjectId;
  transactionNumber: string; // e.g. ETR-20260817-0001
  employeeId: Types.ObjectId;
  employeeName: string;
  type: EmployeeTransactionType;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: Date;
  recordedBy?: Types.ObjectId;
  createdAt: Date;
}

const EmployeeAdvanceSchema = new Schema<IEmployeeAdvance>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    transactionNumber: { type: String, required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    employeeName: { type: String, required: true },
    type: {
      type: String,
      enum: ['ADVANCE_GIVEN', 'SALARY_PAID', 'ADVANCE_DEDUCTED'],
      required: true,
    },
    amountPaise: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    notes: { type: String },
    date: { type: Date, default: Date.now, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EmployeeAdvanceSchema.index({ businessId: 1, employeeId: 1, date: -1 });

export const EmployeeAdvance = model<IEmployeeAdvance>(
  'EmployeeAdvance',
  EmployeeAdvanceSchema
);
