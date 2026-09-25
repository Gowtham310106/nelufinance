// src/config/constants.ts

export const WEIGHT_UNITS = ['kg', 'quintal', 'tonne', 'bag'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

/** Convert any weight unit to kilograms */
export function toKg(value: number, unit: WeightUnit): number {
  let kg: number;
  switch (unit) {
    case 'quintal':
      kg = value * 100;
      break;
    case 'tonne':
      kg = value * 1000;
      break;
    case 'bag':
      kg = value * 75; // Standard rice bag = 75kg
      break;
    case 'kg':
    default:
      kg = value;
  }
  // Round to grams so repeated stock arithmetic doesn't accumulate float error
  return Math.round(kg * 1000) / 1000;
}

/** Convert kilograms to display unit */
export function fromKg(kg: number, unit: WeightUnit): number {
  switch (unit) {
    case 'kg':
      return kg;
    case 'quintal':
      return kg / 100;
    case 'tonne':
      return kg / 1000;
    case 'bag':
      return kg / 75;
    default:
      return kg;
  }
}

export const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'cheque', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const EXPENSE_CATEGORIES = [
  'transport',
  'loading',
  'unloading',
  'electricity',
  'salary',
  'rent',
  'maintenance',
  'food',
  'fuel',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const USER_ROLES = ['owner', 'employee'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PRODUCT_CATEGORIES = [
  'raw_paddy',
  'boiled_rice',
  'raw_rice',
  'idli_rice',
  'ponni_rice',
  'basmati_rice',
  'broken_rice',
  'bran',
  'husk',
  'other',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const TRANSACTION_STATUS = ['completed', 'pending', 'cancelled'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUS)[number];

export const INTEREST_TYPES = ['monthly_percentage', 'annual', 'daily', 'fixed'] as const;
export type InterestType = (typeof INTEREST_TYPES)[number];

/** Reconciliation thresholds in kg */
export const DEFAULT_RECONCILIATION_THRESHOLDS = {
  match: 0.5,
  minor: 5,
  // anything above `minor` is a mismatch
} as const;
