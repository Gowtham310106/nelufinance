// src/features/inventory/inventory.service.ts
import { Types } from 'mongoose';
import { Product } from '../../models/product.model';
import { InventoryTransaction, IInventoryTransaction } from '../../models/inventory-transaction.model';
import { createAuditLog } from '../../services/audit.service';
import { StockAdjustmentInput } from './inventory.validators';
import { dateRangeFilter } from '../../utils/query';
import { changeStock } from '../../services/stock.service';

export interface InventorySummaryItem {
  productId: string;
  name: string;
  nameTamil?: string;
  category: string;
  unit: string;
  currentStockKg: number;
  minimumStockKg: number;
  isLowStock: boolean;
  weightedAvgCostPaisePerKg: number;
  stockValuationPaise: number;
  purchasePricePaise: number;
  sellingPricePaise: number;
}

export class InventoryService {
  async getStockOverview(businessId: string): Promise<{
    items: InventorySummaryItem[];
    totalStockKg: number;
    totalValuationPaise: number;
    lowStockCount: number;
  }> {
    const products = await Product.find({
      businessId: new Types.ObjectId(businessId),
      active: true,
    }).sort({ name: 1 });

    let totalStockKg = 0;
    let totalValuationPaise = 0;
    let lowStockCount = 0;

    const items: InventorySummaryItem[] = products.map((p) => {
      const stockKg = p.currentStockKg || 0;
      const minStock = p.minimumStockKg ?? 50;
      const isLow = stockKg <= minStock;
      const wac = p.weightedAvgCostPaisePerKg || 0;
      const valuation = Math.round(stockKg * wac);

      totalStockKg += stockKg;
      totalValuationPaise += valuation;
      if (isLow) lowStockCount += 1;

      return {
        productId: (p._id as any).toString(),
        name: p.name,
        nameTamil: p.nameTamil,
        category: p.category,
        unit: p.unit,
        currentStockKg: stockKg,
        minimumStockKg: minStock,
        isLowStock: isLow,
        weightedAvgCostPaisePerKg: wac,
        stockValuationPaise: valuation,
        purchasePricePaise: p.purchasePricePaise || 0,
        sellingPricePaise: p.sellingPricePaise || 0,
      };
    });

    return {
      items,
      totalStockKg,
      totalValuationPaise,
      lowStockCount,
    };
  }

  async getMovements(
    businessId: string,
    options: {
      productId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<IInventoryTransaction[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.productId) {
      filter.productId = new Types.ObjectId(options.productId);
    }

    if (options.type) {
      filter.type = options.type;
    }

    const dateFilter = dateRangeFilter(options.startDate, options.endDate);
    if (dateFilter) filter.date = dateFilter;

    return InventoryTransaction.find(filter)
      .populate('productId', 'name nameTamil unit')
      .populate('employeeId', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(Math.min(Math.max(options.limit || 100, 1), 500));
  }

  async adjustStock(
    businessId: string,
    userId: string,
    input: StockAdjustmentInput
  ): Promise<{ transaction: IInventoryTransaction; newStockKg: number }> {
    const product = await Product.findOne({
      _id: new Types.ObjectId(input.productId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!product) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }

    const currentStock = product.currentStockKg || 0;
    const delta = input.type === 'ADJUSTMENT_OUT' ? -input.quantityKg : input.quantityKg;

    // Atomic, conditional update so concurrent sales can't be overwritten
    const newStock = await changeStock(businessId, product._id as Types.ObjectId, delta);
    if (newStock === null) {
      throw Object.assign(
        new Error(`Cannot remove ${input.quantityKg} kg. Current stock is only ${currentStock} kg.`),
        { status: 400 }
      );
    }

    // Record movement
    const txn = await InventoryTransaction.create({
      businessId: new Types.ObjectId(businessId),
      productId: product._id,
      type: input.type,
      quantityKg: input.quantityKg,
      balanceAfterKg: newStock,
      unitRatePaise: product.weightedAvgCostPaisePerKg,
      referenceType: 'ManualAdjustment',
      employeeId: new Types.ObjectId(userId),
      reason: input.reason,
      notes: input.notes,
      date: new Date(),
    });

    // Audit log
    await createAuditLog({
      businessId,
      userId,
      action: 'inventory.adjust',
      entityType: 'Product',
      entityId: (product._id as any).toString(),
      changes: [{ field: 'currentStockKg', oldValue: currentStock, newValue: newStock }],
      reason: input.reason,
    });

    return {
      transaction: txn,
      newStockKg: newStock,
    };
  }
}

export const inventoryService = new InventoryService();
