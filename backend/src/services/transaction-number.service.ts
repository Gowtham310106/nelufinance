// src/services/transaction-number.service.ts
import mongoose from 'mongoose';
import { todayIst } from '../utils/query';

/**
 * Counter collection for auto-incrementing transaction numbers per business per day.
 */
const CounterSchema = new mongoose.Schema({
  _id: String, // e.g., "businessId:SAL:20260817"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', CounterSchema);

export type TransactionPrefix = 'SAL' | 'PUR' | 'PAY' | 'EXP' | 'WRC' | 'ETR' | 'ADK' | 'ADR';

/**
 * Generate a unique transaction number like SAL-20260817-0001, WRC-20260817-0001, or ADK-20260817-0001.
 * Uses MongoDB findOneAndUpdate with $inc for atomicity.
 *
 * @param businessId - The business ID
 * @param prefix - Transaction type prefix (SAL, PUR, PAY, EXP, WRC, ETR, ADK, ADR)
 */
export async function generateTransactionNumber(
  businessId: string,
  prefix: TransactionPrefix
): Promise<string> {
  // Numbers follow the business's (IST) calendar day, not UTC
  const dateStr = todayIst().replace(/-/g, ''); // YYYYMMDD
  const counterId = `${businessId}:${prefix}:${dateStr}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const seq = String(counter!.seq).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}
