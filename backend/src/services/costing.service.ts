// src/services/costing.service.ts
import { weightedAverageCost } from '../utils/decimal';

export interface ICostingEngine {
  calculateNewCost(
    existingStockKg: number,
    existingCostPaisePerKg: number,
    newPurchaseQtyKg: number,
    purchaseRatePaisePerKg: number
  ): number;
}

export class WeightedAverageCostingEngine implements ICostingEngine {
  /**
   * Recalculates product weighted average cost per Kg.
   * If existing stock is <= 0, new cost is simply the purchase rate.
   * Otherwise: (existingStock * existingCost + newQty * newRate) / (existingStock + newQty)
   */
  calculateNewCost(
    existingStockKg: number,
    existingCostPaisePerKg: number,
    newPurchaseQtyKg: number,
    purchaseRatePaisePerKg: number
  ): number {
    if (existingStockKg <= 0) {
      return Math.round(purchaseRatePaisePerKg);
    }
    return weightedAverageCost(
      existingStockKg,
      existingCostPaisePerKg,
      newPurchaseQtyKg,
      purchaseRatePaisePerKg
    );
  }
}

export const costingService = new WeightedAverageCostingEngine();
