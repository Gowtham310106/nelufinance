// src/models/business.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IBusinessSettings {
  defaultUnit: 'kg' | 'quintal' | 'tonne' | 'bag';
  decimalPrecision: number;
  lowStockThresholdKg: number;
  interestConfig: {
    defaultType: 'monthly_percentage' | 'annual' | 'daily' | 'fixed';
    defaultRate: number; // percentage
  };
  allowNegativeStock: boolean;
  reconciliationThresholds: {
    matchKg: number;
    minorKg: number;
  };
}

export interface IBusiness extends Document {
  name: string;
  nameTamil: string;
  address: string;
  phone: string;
  gstNumber?: string;
  ownerId: Types.ObjectId;
  settings: IBusinessSettings;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSettingsSchema = new Schema<IBusinessSettings>(
  {
    defaultUnit: { type: String, enum: ['kg', 'quintal', 'tonne', 'bag'], default: 'kg' },
    decimalPrecision: { type: Number, default: 2 },
    lowStockThresholdKg: { type: Number, default: 100 },
    interestConfig: {
      defaultType: {
        type: String,
        enum: ['monthly_percentage', 'annual', 'daily', 'fixed'],
        default: 'monthly_percentage',
      },
      defaultRate: { type: Number, default: 2 }, // 2% per month
    },
    allowNegativeStock: { type: Boolean, default: false },
    reconciliationThresholds: {
      matchKg: { type: Number, default: 0.5 },
      minorKg: { type: Number, default: 5 },
    },
  },
  { _id: false },
);

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    nameTamil: { type: String, default: '', trim: true },
    address: { type: String, default: '' },
    phone: { type: String, required: true },
    gstNumber: { type: String, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    settings: { type: BusinessSettingsSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Business = model<IBusiness>('Business', BusinessSchema);
