// src/models/product.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import { ProductCategory, WeightUnit, PRODUCT_CATEGORIES, WEIGHT_UNITS } from '../config/constants';

export interface IProduct extends Document {
  businessId: Types.ObjectId;
  name: string;
  nameTamil?: string;
  category: ProductCategory;
  unit: WeightUnit;
  purchasePricePaise: number; // default/latest purchase price in paise/unit
  sellingPricePaise: number;  // selling price in paise/unit
  currentStockKg: number;     // stock always normalized in Kg
  minimumStockKg: number;     // threshold for low stock alert
  weightedAvgCostPaisePerKg: number; // WAC in paise per Kg
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    nameTamil: { type: String, default: '', trim: true },
    category: { type: String, enum: PRODUCT_CATEGORIES, default: 'other' },
    unit: { type: String, enum: WEIGHT_UNITS, default: 'kg' },
    purchasePricePaise: { type: Number, default: 0 },
    sellingPricePaise: { type: Number, default: 0 },
    currentStockKg: { type: Number, default: 0 },
    minimumStockKg: { type: Number, default: 100 },
    weightedAvgCostPaisePerKg: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ businessId: 1, name: 1 });
ProductSchema.index({ businessId: 1, active: 1 });

export const Product = model<IProduct>('Product', ProductSchema);
