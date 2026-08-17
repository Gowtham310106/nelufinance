// src/models/expense.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { ExpenseCategory, PaymentMethod, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../config/constants';

export interface IExpense extends Document {
  businessId: Types.ObjectId;
  transactionNumber: string; // e.g. EXP-20260817-0001
  category: ExpenseCategory;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  employeeId?: Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    transactionNumber: { type: String, required: true, index: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amountPaise: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    notes: { type: String, default: '' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ businessId: 1, date: -1 });
ExpenseSchema.index({ businessId: 1, category: 1, date: -1 });

export const Expense = model<IExpense>('Expense', ExpenseSchema);
