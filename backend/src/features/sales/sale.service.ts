// src/features/sales/sale.service.ts
import { Types } from 'mongoose';
import { Sale, ISale, ISaleItem } from '../../models/sale.model';
import { Product } from '../../models/product.model';
import { Customer } from '../../models/customer.model';
import { Business } from '../../models/business.model';
import { InventoryTransaction } from '../../models/inventory-transaction.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import { toKg } from '../../config/constants';
import { multiplyPaise } from '../../utils/decimal';
import { CreateSaleInput } from './sale.validators';
import { changeStock } from '../../services/stock.service';
import { dateRangeFilter } from '../../utils/query';

export class SaleService {
  async create(businessId: string, userId: string, input: CreateSaleInput): Promise<ISale> {
    const bId = new Types.ObjectId(businessId);
    const business = await Business.findById(businessId);
    const allowNegative = business?.settings?.allowNegativeStock ?? false;

    // Resolve customer if provided — it must belong to this business
    let customerName = '';
    if (input.customerId) {
      const customer = await Customer.findOne({
        _id: new Types.ObjectId(input.customerId),
        businessId: bId,
      });
      if (!customer) {
        throw Object.assign(new Error('Customer not found'), { status: 404 });
      }
      customerName = customer.name;
    }

    // 1. Validate items and verify stock availability
    const processedItems: ISaleItem[] = [];
    const kgByProduct = new Map<string, { name: string; kg: number; stock: number }>();
    let totalAmountPaise = 0;
    let totalCostPaise = 0;

    for (const item of input.items) {
      const product = await Product.findOne({
        _id: new Types.ObjectId(item.productId),
        businessId: bId,
      });

      if (!product) {
        throw Object.assign(new Error(`Product not found: ${item.productId}`), { status: 404 });
      }

      const quantityKg = toKg(item.inputQuantity, item.inputUnit);

      // Sum quantities per product so repeated lines can't bypass the stock check
      const key = product._id.toString();
      const entry = kgByProduct.get(key) || {
        name: product.name,
        kg: 0,
        stock: product.currentStockKg || 0,
      };
      entry.kg = Math.round((entry.kg + quantityKg) * 1000) / 1000;
      kgByProduct.set(key, entry);

      const itemTotalAmountPaise = multiplyPaise(quantityKg, item.ratePaisePerKg);
      const costSnapshot = product.weightedAvgCostPaisePerKg || 0;
      const itemCostPaise = multiplyPaise(quantityKg, costSnapshot);

      totalAmountPaise += itemTotalAmountPaise;
      totalCostPaise += itemCostPaise;

      processedItems.push({
        productId: product._id as Types.ObjectId,
        productName: product.name,
        inputUnit: item.inputUnit,
        inputQuantity: item.inputQuantity,
        quantityKg,
        ratePaisePerKg: item.ratePaisePerKg,
        totalAmountPaise: itemTotalAmountPaise,
        costPaisePerKgSnapshot: costSnapshot,
        totalCostPaise: itemCostPaise,
      });
    }

    if (!allowNegative) {
      for (const { name, kg, stock } of kgByProduct.values()) {
        if (stock < kg) {
          throw Object.assign(
            new Error(`Insufficient stock for "${name}". Available: ${stock} kg, Requested: ${kg} kg`),
            { status: 400 },
          );
        }
      }
    }

    const receivedAmountPaise = Math.min(input.receivedAmountPaise || 0, totalAmountPaise);
    const creditAmountPaise = Math.max(0, totalAmountPaise - receivedAmountPaise);
    const grossProfitPaise = totalAmountPaise - totalCostPaise;
    const saleDate = input.date ? new Date(input.date) : new Date();

    if (creditAmountPaise > 0 && !input.customerId) {
      throw Object.assign(
        new Error('Select a customer for credit (udhaar) sales so the balance can be tracked'),
        { status: 400 },
      );
    }

    // 2. Deduct stock atomically (conditional on availability); roll back on any failure
    const deducted: { productId: string; kg: number }[] = [];
    const stockAfter = new Map<string, number>();
    const rollbackStock = async () => {
      for (const d of deducted) {
        await changeStock(businessId, d.productId, d.kg, { allowNegative: true });
      }
    };

    for (const [productId, { name, kg }] of kgByProduct) {
      const newStock = await changeStock(businessId, productId, -kg, { allowNegative });
      if (newStock === null) {
        await rollbackStock();
        throw Object.assign(
          new Error(`Insufficient stock for "${name}" — it may have just been sold. Please retry.`),
          { status: 409 },
        );
      }
      deducted.push({ productId, kg });
      stockAfter.set(productId, newStock);
    }

    // 3. Create Sale record
    let sale: ISale;
    let txnNumber: string;
    try {
      txnNumber = await generateTransactionNumber(businessId, 'SAL');
      sale = await Sale.create({
        businessId: bId,
        transactionNumber: txnNumber,
        customerId: input.customerId ? new Types.ObjectId(input.customerId) : undefined,
        customerName: customerName || undefined,
        items: processedItems,
        totalAmountPaise,
        receivedAmountPaise,
        creditAmountPaise,
        totalCostPaise,
        grossProfitPaise,
        paymentMethod: input.paymentMethod,
        notes: input.notes || '',
        employeeId: new Types.ObjectId(userId),
        date: saleDate,
      });
    } catch (error) {
      await rollbackStock();
      throw error;
    }

    // 4. Record inventory transactions (running balance per product, in line order)
    const runningBalance = new Map<string, number>();
    for (const [productId, { kg }] of kgByProduct) {
      runningBalance.set(productId, Math.round(((stockAfter.get(productId) ?? 0) + kg) * 1000) / 1000);
    }
    for (const item of processedItems) {
      const key = item.productId.toString();
      const balanceAfterKg = Math.round(((runningBalance.get(key) ?? 0) - item.quantityKg) * 1000) / 1000;
      runningBalance.set(key, balanceAfterKg);

      await InventoryTransaction.create({
        businessId: bId,
        productId: item.productId,
        type: 'SALE_OUT',
        quantityKg: item.quantityKg,
        balanceAfterKg,
        unitRatePaise: item.ratePaisePerKg,
        referenceType: 'Sale',
        referenceId: sale._id,
        employeeId: new Types.ObjectId(userId),
        notes: `Sale ${txnNumber}`,
        date: saleDate,
      });
    }

    // 5. Update customer credit balance if sale was on credit
    if (input.customerId && creditAmountPaise > 0) {
      await Customer.updateOne(
        { _id: new Types.ObjectId(input.customerId), businessId: bId },
        { $inc: { currentBalancePaise: creditAmountPaise } },
      );
    }

    // 6. Audit Log
    await createAuditLog({
      businessId,
      userId,
      action: 'sale.create',
      entityType: 'Sale',
      entityId: (sale._id as any).toString(),
      changes: [
        { field: 'transactionNumber', oldValue: null, newValue: txnNumber },
        { field: 'totalAmountPaise', oldValue: null, newValue: totalAmountPaise },
        { field: 'grossProfitPaise', oldValue: null, newValue: grossProfitPaise },
      ],
      reason: `Recorded sale ${txnNumber} for ${customerName || 'Cash Customer'}`,
    });

    return sale;
  }

  async getAll(
    businessId: string,
    options: { startDate?: string; endDate?: string; customerId?: string } = {}
  ): Promise<ISale[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.customerId) {
      filter.customerId = new Types.ObjectId(options.customerId);
    }

    const dateFilter = dateRangeFilter(options.startDate, options.endDate);
    if (dateFilter) filter.date = dateFilter;

    return Sale.find(filter).sort({ date: -1, createdAt: -1 });
  }

  async getById(businessId: string, saleId: string): Promise<ISale | null> {
    return Sale.findOne({
      _id: new Types.ObjectId(saleId),
      businessId: new Types.ObjectId(businessId),
    });
  }
}

export const saleService = new SaleService();
