// src/features/weight-reconciliation/weight-reconciliation.service.ts
import { Types } from 'mongoose';
import {
  WeightReconciliation,
  IWeightReconciliation,
} from '../../models/weight-reconciliation.model';
import { Product } from '../../models/product.model';
import { Supplier } from '../../models/supplier.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import { CreateWeightReconciliationInput } from './weight-reconciliation.validators';

export class WeightReconciliationService {
  async create(
    businessId: string,
    userId: string,
    input: CreateWeightReconciliationInput
  ): Promise<IWeightReconciliation> {
    const txnNumber = await generateTransactionNumber(businessId, 'WRC');

    const product = await Product.findOne({
      _id: new Types.ObjectId(input.productId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!product) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }

    let supplierName = '';
    if (input.supplierId) {
      const supplier = await Supplier.findOne({
        _id: new Types.ObjectId(input.supplierId),
        businessId: new Types.ObjectId(businessId),
      });
      if (supplier) {
        supplierName = supplier.name;
      }
    }

    const netWeighbridge = input.grossWeightKg - input.tareWeightKg;
    const bagCalculated = input.bagCount * input.bagStandardWeightKg;
    const discrepancyKg = netWeighbridge - bagCalculated;
    const discrepancyPercentage =
      bagCalculated > 0
        ? Math.round((discrepancyKg / bagCalculated) * 10000) / 100
        : 0;

    let finalWeight = netWeighbridge;
    if (input.actionTaken === 'ACCEPT_BAG_COUNT') {
      finalWeight = bagCalculated;
    } else if (input.actionTaken === 'SPLIT_DIFFERENCE') {
      finalWeight = Math.round((netWeighbridge + bagCalculated) / 2);
    } else if (input.actionTaken === 'DISPUTED') {
      finalWeight = bagCalculated;
    }

    const recordDate = input.date ? new Date(input.date) : new Date();

    const record = await WeightReconciliation.create({
      businessId: new Types.ObjectId(businessId),
      transactionNumber: txnNumber,
      lorryNumber: input.lorryNumber,
      driverName: input.driverName || '',
      driverPhone: input.driverPhone || '',
      supplierId: input.supplierId ? new Types.ObjectId(input.supplierId) : undefined,
      supplierName: supplierName || undefined,
      productId: product._id,
      productName: product.name,
      grossWeightKg: input.grossWeightKg,
      tareWeightKg: input.tareWeightKg,
      netWeighbridgeWeightKg: netWeighbridge,
      bagCount: input.bagCount,
      bagStandardWeightKg: input.bagStandardWeightKg,
      bagCalculatedWeightKg: bagCalculated,
      discrepancyKg,
      discrepancyPercentage,
      actionTaken: input.actionTaken,
      finalAcceptedWeightKg: finalWeight,
      notes: input.notes || '',
      employeeId: new Types.ObjectId(userId),
      date: recordDate,
    });

    await createAuditLog({
      businessId,
      userId,
      action: 'weight_reconciliation.create',
      entityType: 'WeightReconciliation',
      entityId: (record._id as any).toString(),
      changes: [
        { field: 'transactionNumber', oldValue: null, newValue: txnNumber },
        { field: 'discrepancyKg', oldValue: null, newValue: discrepancyKg },
      ],
      reason: `Recorded weighbridge check for lorry ${input.lorryNumber} (${discrepancyKg} kg diff)`,
    });

    return record;
  }

  async getAll(businessId: string): Promise<IWeightReconciliation[]> {
    return WeightReconciliation.find({
      businessId: new Types.ObjectId(businessId),
    }).sort({ date: -1, createdAt: -1 });
  }
}

export const weightReconciliationService = new WeightReconciliationService();
