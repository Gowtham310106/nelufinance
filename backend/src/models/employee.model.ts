// src/models/employee.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export type EmployeeRole = 'manager' | 'cashier' | 'labor' | 'driver' | 'helper';
export type SalaryType = 'daily' | 'monthly' | 'per_bag';

export interface IEmployee extends Document {
  businessId: Types.ObjectId;
  name: string;
  phone: string;
  role: EmployeeRole;
  salaryType: SalaryType;
  baseSalaryPaise: number; // Daily wage or monthly salary or per-bag rate in paise
  currentAdvancePaise: number; // Outstanding advance owed by employee
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['manager', 'cashier', 'labor', 'driver', 'helper'],
      default: 'labor',
    },
    salaryType: {
      type: String,
      enum: ['daily', 'monthly', 'per_bag'],
      default: 'daily',
    },
    baseSalaryPaise: { type: Number, default: 0 },
    currentAdvancePaise: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

EmployeeSchema.index({ businessId: 1, phone: 1 });
EmployeeSchema.index({ businessId: 1, active: 1 });

export const Employee = model<IEmployee>('Employee', EmployeeSchema);
