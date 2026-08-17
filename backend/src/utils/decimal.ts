// src/utils/decimal.ts

/**
 * Safe integer arithmetic for money (paise) and weight (grams when precision matters).
 * Avoids floating-point errors by operating on integers.
 */

/** Convert rupees to paise (integer) */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paise to rupees (for display) */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format paise as Indian rupee string.
 * Example: 28450000 → "₹2,84,500.00"
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format weight in kg with Indian locale.
 * Example: 1842.5 → "1,842.50 kg"
 */
export function formatWeight(kg: number, unit: string = 'kg'): string {
  return `${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kg)} ${unit}`;
}

/**
 * Safe multiplication for paise: quantity (kg, decimal) × rate (paise/kg) = total paise.
 * Rounds to nearest paise.
 */
export function multiplyPaise(quantityKg: number, ratePaisePerKg: number): number {
  return Math.round(quantityKg * ratePaisePerKg);
}

/**
 * Weighted average cost recalculation (in paise).
 * newAvg = (existingQty × oldAvg + newQty × newRate) / (existingQty + newQty)
 */
export function weightedAverageCost(
  existingQtyKg: number,
  existingAvgPaise: number,
  newQtyKg: number,
  newRatePaise: number,
): number {
  const totalQty = existingQtyKg + newQtyKg;
  if (totalQty === 0) return 0;
  return Math.round(
    (existingQtyKg * existingAvgPaise + newQtyKg * newRatePaise) / totalQty,
  );
}
