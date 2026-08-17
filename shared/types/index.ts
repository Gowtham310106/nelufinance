// shared/types/index.ts

/**
 * Standard API response format used by both frontend and backend.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Enums ──────────────────────────────────────────────────

export type UserRole = 'owner' | 'employee';

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export type WeightUnit = 'kg' | 'quintal' | 'tonne' | 'bag';

export type TransactionStatus = 'completed' | 'pending' | 'cancelled';

export type ProductCategory =
  | 'raw_paddy'
  | 'boiled_rice'
  | 'raw_rice'
  | 'idli_rice'
  | 'ponni_rice'
  | 'basmati_rice'
  | 'broken_rice'
  | 'bran'
  | 'husk'
  | 'other';

export type ExpenseCategory =
  | 'transport'
  | 'loading'
  | 'unloading'
  | 'electricity'
  | 'salary'
  | 'rent'
  | 'maintenance'
  | 'food'
  | 'fuel'
  | 'other';

export type InterestType = 'monthly_percentage' | 'annual' | 'daily' | 'fixed';

export type ReconciliationStatus = 'match' | 'minor_difference' | 'mismatch';

export type DayClosingStatus = 'open' | 'closed';

// ── Shared Data Shapes ────────────────────────────────────

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  language: 'en' | 'ta';
  businessId?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}
