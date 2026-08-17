// src/models/user.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  passwordHash: string;
  name: string;
  role: 'owner' | 'employee';
  language: 'en' | 'ta';
  businessId?: Types.ObjectId;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['owner', 'employee'], default: 'owner' },
    language: { type: String, enum: ['en', 'ta'], default: 'en' },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', UserSchema);
