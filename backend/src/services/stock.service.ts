// src/services/stock.service.ts
import { Types } from 'mongoose';
import { Product } from '../models/product.model';

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Atomically change a product's stock by `deltaKg` (negative = remove).
 * When removing stock and negatives are not allowed, the update only applies if enough
 * stock exists at write time, so concurrent sales can't oversell.
 * Returns the stock after the change, or null if there wasn't enough stock / no product.
 */
export async function changeStock(
  businessId: string | Types.ObjectId,
  productId: string | Types.ObjectId,
  deltaKg: number,
  options: { allowNegative?: boolean; set?: Record<string, unknown> } = {},
): Promise<number | null> {
  const filter: Record<string, unknown> = {
    _id: new Types.ObjectId(String(productId)),
    businessId: new Types.ObjectId(String(businessId)),
  };
  if (deltaKg < 0 && !options.allowNegative) {
    filter.currentStockKg = { $gte: round3(-deltaKg) };
  }

  const update: Record<string, unknown> = { $inc: { currentStockKg: round3(deltaKg) } };
  if (options.set) update.$set = options.set;

  const product = await Product.findOneAndUpdate(filter, update, { returnDocument: 'after' });
  return product ? round3(product.currentStockKg || 0) : null;
}
