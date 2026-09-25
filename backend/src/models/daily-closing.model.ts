// src/models/daily-closing.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDenominationCount {
  d500: number;
  d200: number;
  d100: number;
  d50: number;
  d20: number;
  d10: number;
  coins: number;
}

export interface IDailyClosing extends Document {
  businessId: Types.ObjectId;
  closingDate: string; // YYYY-MM-DD
  openingCashPaise: number;
  cashSalesPaise: number;
  cashPaymentsReceivedPaise: number;
  cashPaymentsGivenPaise: number;
  cashExpensesPaise: number;
  purchaseCashOutPaise: number; // Cash paid upfront on purchases (not recorded as Payment docs)
  advancesPaidPaise: number; // Employee ADVANCE_GIVEN in cash (salary is already an Expense)
  adakuLoansOutPaise: number; // Pawn loan amounts paid out
  adakuReceiptsPaise: number; // Cash vatti / principal received on pawn loans
  expectedClosingCashPaise: number;
  actualCashInDrawerPaise: number;
  cashVariancePaise: number; // actual - expected
  denominations: IDenominationCount;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  notes?: string;
  closedBy?: Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DenominationSchema = new Schema<IDenominationCount>(
  {
    d500: { type: Number, default: 0 },
    d200: { type: Number, default: 0 },
    d100: { type: Number, default: 0 },
    d50: { type: Number, default: 0 },
    d20: { type: Number, default: 0 },
    d10: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
  },
  { _id: false }
);

const DailyClosingSchema = new Schema<IDailyClosing>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    closingDate: { type: String, required: true, index: true },
    openingCashPaise: { type: Number, default: 0 },
    cashSalesPaise: { type: Number, default: 0 },
    cashPaymentsReceivedPaise: { type: Number, default: 0 },
    cashPaymentsGivenPaise: { type: Number, default: 0 },
    cashExpensesPaise: { type: Number, default: 0 },
    purchaseCashOutPaise: { type: Number, default: 0 },
    advancesPaidPaise: { type: Number, default: 0 },
    adakuLoansOutPaise: { type: Number, default: 0 },
    adakuReceiptsPaise: { type: Number, default: 0 },
    expectedClosingCashPaise: { type: Number, required: true },
    actualCashInDrawerPaise: { type: Number, required: true },
    cashVariancePaise: { type: Number, required: true },
    denominations: { type: DenominationSchema, required: true },
    status: { type: String, enum: ['OPEN', 'CLOSED', 'LOCKED'], default: 'CLOSED' },
    notes: { type: String },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DailyClosingSchema.index({ businessId: 1, closingDate: -1 }, { unique: true });

export const DailyClosing = model<IDailyClosing>('DailyClosing', DailyClosingSchema);
