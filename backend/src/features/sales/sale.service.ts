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

export class SaleService {
  async create(businessId: string, userId: string, input: CreateSaleInput): Promise<ISale> {
    const txnNumber = await generateTransactionNumber(businessId, 'SAL');

    const business = await Business.findById(businessId);
    const allowNegative = business?.settings?.allowNegativeStock ?? false;

    // Resolve customer if provided
    let customerName = '';
    if (input.customerId) {
      const customer = await Customer.findOne({
        _id: new Types.ObjectId(input.customerId),
        businessId: new Types.ObjectId(businessId),
      });
      if (customer) {
        customerName = customer.name;
      }
    }

    // 1. Validate items and verify stock availability
    const processedItems: ISaleItem[] = [];
    let totalAmountPaise = 0;
    let totalCostPaise = 0;

    for (const item of input.items) {
      const product = await Product.findOne({
        _id: new Types.ObjectId(item.productId),
        businessId: new Types.ObjectId(businessId),
      });

      if (!product) {
        throw Object.assign(new Error(`Product not found: ${item.productId}`), { status: 404 });
      }

      const quantityKg = toKg(item.inputQuantity, item.inputUnit);

      if (!allowNegative && (product.currentStockKg || 0) < quantityKg) {
        throw Object.assign(
          new Error(
            `Insufficient stock for "${product.name}". Available: ${product.currentStockKg} kg, Requested: ${quantityKg} kg`
          ),
          { status: 400 }
        );
      }

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

    const receivedAmountPaise = Math.min(input.receivedAmountPaise || 0, totalAmountPaise);
    const creditAmountPaise = Math.max(0, totalAmountPaise - receivedAmountPaise);
    const grossProfitPaise = totalAmountPaise - totalCostPaise;
    const saleDate = input.date ? new Date(input.date) : new Date();

    // 2. Create Sale record
    const sale = await Sale.create({
      businessId: new Types.ObjectId(businessId),
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

    // 3. Decrement product stock & record inventory transactions
    for (const item of processedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const newStock = (product.currentStockKg || 0) - item.quantityKg;

      await Product.findByIdAndUpdate(item.productId, {
        $set: { currentStockKg: newStock },
      });

      await InventoryTransaction.create({
        businessId: new Types.ObjectId(businessId),
        productId: item.productId,
        type: 'SALE_OUT',
        quantityKg: item.quantityKg,
        balanceAfterKg: newStock,
        unitRatePaise: item.ratePaisePerKg,
        referenceType: 'Sale',
        referenceId: sale._id,
        employeeId: new Types.ObjectId(userId),
        notes: `Sale ${txnNumber}`,
        date: saleDate,
      });
    }

    // 4. Update customer credit balance if sale was on credit
    if (input.customerId && creditAmountPaise > 0) {
      await Customer.findByIdAndUpdate(input.customerId, {
        $inc: { currentBalancePaise: creditAmountPaise },
      });
    }

    // 5. Audit Log
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

    if (options.startDate || options.endDate) {
      filter.date = {};
      if (options.startDate) filter.date.$gte = new Date(options.startDate);
      if (options.endDate) filter.date.$lte = new Date(options.endDate);
    }

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
