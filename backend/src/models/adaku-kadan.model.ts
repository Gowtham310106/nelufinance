// src/models/adaku-kadan.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export type AdakuItemType = 'gold' | 'silver' | 'brass_metal' | 'other';
export type AdakuStatus = 'ACTIVE' | 'PARTIALLY_PAID' | 'REDEEMED' | 'OVERDUE' | 'AUCTIONED';

export interface IAdakuImage {
  url: string;
  key: string;
  caption?: string;
  uploadedAt: Date;
}

export interface IAdakuKadan extends Document {
  businessId: Types.ObjectId;
  pledgeNumber: string; // e.g. ADK-20260817-0001
  customerId?: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerAadhaar?: string;
  customerAddress?: string;
  itemType: AdakuItemType;
  purityKarat: string; // e.g. "22K (916 KDM)", "20K", "18K", "Silver 92.5"
  itemDescription: string; // e.g. "1 Gold Chain (3 Pavan) with locket"
  itemCount: number;
  grossWeightGrams: number; // e.g. 24.50
  stoneWeightGrams: number; // e.g. 0.50
  netWeightGrams: number;   // gross - stone (e.g. 24.00)
  marketValuePaise: number;
  loanAmountPaise: number; // Principal lent
  monthlyVattiRate: number; // e.g. 1.5 or 2.0 per 100 per month
  lockerNumber?: string;   // e.g. "Box A-12"
  images: IAdakuImage[];   // Up to 5 photos (item on weighing scale, bills, etc.)
  status: AdakuStatus;
  pledgeDate: Date;
  dueDate: Date;           // Usually 12 months from pledgeDate
  redeemedDate?: Date;
  totalInterestPaidPaise: number;
  notes?: string;
  recordedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdakuImageSchema = new Schema<IAdakuImage>(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
    caption: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AdakuKadanSchema = new Schema<IAdakuKadan>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    pledgeNumber: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerAadhaar: { type: String, trim: true },
    customerAddress: { type: String, trim: true },
    itemType: {
      type: String,
      enum: ['gold', 'silver', 'brass_metal', 'other'],
      default: 'gold',
    },
    purityKarat: { type: String, default: '22K (916 KDM)' },
    itemDescription: { type: String, required: true },
    itemCount: { type: Number, default: 1 },
    grossWeightGrams: { type: Number, required: true },
    stoneWeightGrams: { type: Number, default: 0 },
    netWeightGrams: { type: Number, required: true },
    marketValuePaise: { type: Number, default: 0 },
    loanAmountPaise: { type: Number, required: true },
    monthlyVattiRate: { type: Number, default: 2.0 },
    lockerNumber: { type: String, default: '' },
    images: { type: [AdakuImageSchema], default: [] },
    status: {
      type: String,
      enum: ['ACTIVE', 'PARTIALLY_PAID', 'REDEEMED', 'OVERDUE', 'AUCTIONED'],
      default: 'ACTIVE',
      index: true,
    },
    pledgeDate: { type: Date, default: Date.now, index: true },
    dueDate: { type: Date, required: true },
    redeemedDate: { type: Date },
    totalInterestPaidPaise: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AdakuKadanSchema.index({ businessId: 1, status: 1 });
AdakuKadanSchema.index({ businessId: 1, customerPhone: 1 });
AdakuKadanSchema.index({ businessId: 1, pledgeDate: -1 });

export const AdakuKadan = model<IAdakuKadan>('AdakuKadan', AdakuKadanSchema);
