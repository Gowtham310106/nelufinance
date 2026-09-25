// src/features/payments/payment.service.ts
import { Types } from 'mongoose';
import { Payment, IPayment } from '../../models/payment.model';
import { Customer } from '../../models/customer.model';
import { Supplier } from '../../models/supplier.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import { CreatePaymentInput } from './payment.validators';
import { dateRangeFilter } from '../../utils/query';

export class PaymentService {
  async create(businessId: string, userId: string, input: CreatePaymentInput): Promise<IPayment> {
    const bId = new Types.ObjectId(businessId);
    const partyId = new Types.ObjectId(input.partyId);
    let partyName = '';

    if (input.partyType === 'CUSTOMER') {
      const customer = await Customer.findOne({ _id: partyId, businessId: bId });
      if (!customer) {
        throw Object.assign(new Error('Customer not found'), { status: 404 });
      }
      partyName = customer.name;
    } else {
      const supplier = await Supplier.findOne({ _id: partyId, businessId: bId });
      if (!supplier) {
        throw Object.assign(new Error('Supplier not found'), { status: 404 });
      }
      partyName = supplier.name;
    }

    const paymentDate = input.date ? new Date(input.date) : new Date();
    const txnNumber = await generateTransactionNumber(businessId, 'PAY');

    // Create the payment record first so a failure can never leave a balance changed
    // without a matching payment entry.
    const payment = await Payment.create({
      businessId: bId,
      transactionNumber: txnNumber,
      type: input.type,
      partyType: input.partyType,
      partyId,
      partyName,
      amountPaise: input.amountPaise,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || '',
      notes: input.notes || '',
      employeeId: new Types.ObjectId(userId),
      date: paymentDate,
    });

    if (input.partyType === 'CUSTOMER') {
      // Received from customer reduces what they owe; given to customer (refund/advance) increases it
      const delta = input.type === 'RECEIVED' ? -input.amountPaise : input.amountPaise;
      await Customer.updateOne({ _id: partyId, businessId: bId }, { $inc: { currentBalancePaise: delta } });
    } else {
      // Given to supplier reduces our payable; received from supplier (refund) increases it
      const delta = input.type === 'GIVEN' ? -input.amountPaise : input.amountPaise;
      await Supplier.updateOne({ _id: partyId, businessId: bId }, { $inc: { currentPayablePaise: delta } });
    }

    await createAuditLog({
      businessId,
      userId,
      action: 'payment.create',
      entityType: 'Payment',
      entityId: (payment._id as any).toString(),
      changes: [
        { field: 'transactionNumber', oldValue: null, newValue: txnNumber },
        { field: 'amountPaise', oldValue: null, newValue: input.amountPaise },
      ],
      reason: `Recorded ${input.type} payment of ₹${(input.amountPaise / 100).toFixed(2)} for ${partyName}`,
    });

    return payment;
  }

  async getAll(
    businessId: string,
    options: {
      type?: string;
      partyType?: string;
      partyId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<IPayment[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.type) filter.type = options.type;
    if (options.partyType) filter.partyType = options.partyType;
    if (options.partyId) filter.partyId = new Types.ObjectId(options.partyId);

    const dateFilter = dateRangeFilter(options.startDate, options.endDate);
    if (dateFilter) filter.date = dateFilter;

    return Payment.find(filter).sort({ date: -1, createdAt: -1 });
  }
}

export const paymentService = new PaymentService();
