// src/features/purchases/purchase.service.ts
import { Types } from 'mongoose';
import { Purchase, IPurchase, IPurchaseItem } from '../../models/purchase.model';
import { Product } from '../../models/product.model';
import { Supplier } from '../../models/supplier.model';
import { InventoryTransaction } from '../../models/inventory-transaction.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { costingService } from '../../services/costing.service';
import { createAuditLog } from '../../services/audit.service';
import { toKg } from '../../config/constants';
import { multiplyPaise } from '../../utils/decimal';
import { CreatePurchaseInput } from './purchase.validators';
import { changeStock } from '../../services/stock.service';
import { dateRangeFilter } from '../../utils/query';

export class PurchaseService {
  async create(businessId: string, userId: string, input: CreatePurchaseInput): Promise<IPurchase> {
    // Resolve supplier — it must belong to this business
    let supplierName = '';
    if (input.supplierId) {
      const supplier = await Supplier.findOne({
        _id: new Types.ObjectId(input.supplierId),
        businessId: new Types.ObjectId(businessId),
      });
      if (!supplier) {
        throw Object.assign(new Error('Supplier not found'), { status: 404 });
      }
      supplierName = supplier.name;
    }

    // Process each item: normalize weight, compute amount
    const processedItems: IPurchaseItem[] = [];
    let totalAmountPaise = 0;

    for (const item of input.items) {
      const product = await Product.findOne({
        _id: new Types.ObjectId(item.productId),
        businessId: new Types.ObjectId(businessId),
      });

      if (!product) {
        throw Object.assign(new Error(`Product not found: ${item.productId}`), { status: 404 });
      }

      const quantityKg = toKg(item.inputQuantity, item.inputUnit);
      const itemTotalPaise = multiplyPaise(quantityKg, item.ratePaisePerKg);
      totalAmountPaise += itemTotalPaise;

      processedItems.push({
        productId: product._id as Types.ObjectId,
        productName: product.name,
        inputUnit: item.inputUnit,
        inputQuantity: item.inputQuantity,
        quantityKg,
        ratePaisePerKg: item.ratePaisePerKg,
        totalAmountPaise: itemTotalPaise,
      });
    }

    const paidAmountPaise = Math.min(input.paidAmountPaise || 0, totalAmountPaise);
    const pendingAmountPaise = Math.max(0, totalAmountPaise - paidAmountPaise);
    const purchaseDate = input.date ? new Date(input.date) : new Date();

    if (pendingAmountPaise > 0 && !input.supplierId) {
      throw Object.assign(
        new Error('Select a supplier for purchases on credit so the payable can be tracked'),
        { status: 400 },
      );
    }

    const txnNumber = await generateTransactionNumber(businessId, 'PUR');

    // 1. Create Purchase document
    const purchase = await Purchase.create({
      businessId: new Types.ObjectId(businessId),
      transactionNumber: txnNumber,
      supplierId: input.supplierId ? new Types.ObjectId(input.supplierId) : undefined,
      supplierName: supplierName || undefined,
      items: processedItems,
      totalAmountPaise,
      paidAmountPaise,
      pendingAmountPaise,
      paymentMethod: input.paymentMethod,
      notes: input.notes || '',
      employeeId: new Types.ObjectId(userId),
      date: purchaseDate,
    });

    // 2. Update stock & WAC for each product and record inventory movements.
    // Optimistic concurrency: the update only applies if stock/WAC are unchanged since we
    // read them, so concurrent purchases/sales can't overwrite each other's stock.
    for (const item of processedItems) {
      let newStock: number | null = null;
      for (let attempt = 0; attempt < 5 && newStock === null; attempt++) {
        const product = await Product.findOne({
          _id: item.productId,
          businessId: new Types.ObjectId(businessId),
        });
        if (!product) break;

        const existingStock = product.currentStockKg || 0;
        const existingWac = product.weightedAvgCostPaisePerKg || 0;
        const newWac = costingService.calculateNewCost(
          existingStock,
          existingWac,
          item.quantityKg,
          item.ratePaisePerKg
        );
        const candidateStock = Math.round((existingStock + item.quantityKg) * 1000) / 1000;

        const updated = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            currentStockKg: product.currentStockKg,
            weightedAvgCostPaisePerKg: product.weightedAvgCostPaisePerKg,
          },
          {
            $set: {
              currentStockKg: candidateStock,
              weightedAvgCostPaisePerKg: newWac,
              purchasePricePaise: item.ratePaisePerKg,
            },
          },
          { returnDocument: 'after' }
        );
        if (updated) newStock = candidateStock;
      }

      if (newStock === null) {
        // Fall back to a plain atomic increment so stock is never lost
        newStock = await changeStock(businessId, item.productId, item.quantityKg, {
          allowNegative: true,
          set: { purchasePricePaise: item.ratePaisePerKg },
        });
        if (newStock === null) continue;
      }

      await InventoryTransaction.create({
        businessId: new Types.ObjectId(businessId),
        productId: item.productId,
        type: 'PURCHASE_IN',
        quantityKg: item.quantityKg,
        balanceAfterKg: newStock,
        unitRatePaise: item.ratePaisePerKg,
        referenceType: 'Purchase',
        referenceId: purchase._id,
        employeeId: new Types.ObjectId(userId),
        notes: `Purchase ${txnNumber}`,
        date: purchaseDate,
      });
    }

    // 3. Update supplier payable if pending balance
    if (input.supplierId && pendingAmountPaise > 0) {
      await Supplier.updateOne(
        { _id: new Types.ObjectId(input.supplierId), businessId: new Types.ObjectId(businessId) },
        { $inc: { currentPayablePaise: pendingAmountPaise } }
      );
    }

    // 4. Audit Log
    await createAuditLog({
      businessId,
      userId,
      action: 'purchase.create',
      entityType: 'Purchase',
      entityId: (purchase._id as any).toString(),
      changes: [
        { field: 'transactionNumber', oldValue: null, newValue: txnNumber },
        { field: 'totalAmountPaise', oldValue: null, newValue: totalAmountPaise },
      ],
      reason: `Recorded purchase ${txnNumber}`,
    });

    return purchase;
  }

  async getAll(
    businessId: string,
    options: { startDate?: string; endDate?: string; supplierId?: string } = {}
  ): Promise<IPurchase[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.supplierId) {
      filter.supplierId = new Types.ObjectId(options.supplierId);
    }

    const dateFilter = dateRangeFilter(options.startDate, options.endDate);
    if (dateFilter) filter.date = dateFilter;

    return Purchase.find(filter).sort({ date: -1, createdAt: -1 });
  }

  async getById(businessId: string, purchaseId: string): Promise<IPurchase | null> {
    return Purchase.findOne({
      _id: new Types.ObjectId(purchaseId),
      businessId: new Types.ObjectId(businessId),
    });
  }
}

export const purchaseService = new PurchaseService();
