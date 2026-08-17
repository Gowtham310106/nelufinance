// src/features/payments/payment.service.ts
import { Types } from 'mongoose';
import { Payment, IPayment } from '../../models/payment.model';
import { Customer } from '../../models/customer.model';
import { Supplier } from '../../models/supplier.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import { CreatePaymentInput } from './payment.validators';

export class PaymentService {
  async create(businessId: string, userId: string, input: CreatePaymentInput): Promise<IPayment> {
    const txnNumber = await generateTransactionNumber(businessId, 'PAY');
    let partyName = '';

    if (input.partyType === 'CUSTOMER') {
      const customer = await Customer.findOne({
        _id: new Types.ObjectId(input.partyId),
        businessId: new Types.ObjectId(businessId),
      });

      if (!customer) {
        throw Object.assign(new Error('Customer not found'), { status: 404 });
      }

      partyName = customer.name;

      // When payment is received from customer, it reduces their credit balance
      if (input.type === 'RECEIVED') {
        await Customer.findByIdAndUpdate(input.partyId, {
          $inc: { currentBalancePaise: -input.amountPaise },
        });
      }
    } else if (input.partyType === 'SUPPLIER') {
      const supplier = await Supplier.findOne({
        _id: new Types.ObjectId(input.partyId),
        businessId: new Types.ObjectId(businessId),
      });

      if (!supplier) {
        throw Object.assign(new Error('Supplier not found'), { status: 404 });
      }

      partyName = supplier.name;

      // When payment is given to supplier, it reduces our payable amount
      if (input.type === 'GIVEN') {
        await Supplier.findByIdAndUpdate(input.partyId, {
          $inc: { currentPayablePaise: -input.amountPaise },
        });
      }
    }

    const paymentDate = input.date ? new Date(input.date) : new Date();

    const payment = await Payment.create({
      businessId: new Types.ObjectId(businessId),
      transactionNumber: txnNumber,
      type: input.type,
      partyType: input.partyType,
      partyId: new Types.ObjectId(input.partyId),
      partyName,
      amountPaise: input.amountPaise,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || '',
      notes: input.notes || '',
      employeeId: new Types.ObjectId(userId),
      date: paymentDate,
    });

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

    if (options.startDate || options.endDate) {
      filter.date = {};
      if (options.startDate) filter.date.$gte = new Date(options.startDate);
      if (options.endDate) filter.date.$lte = new Date(options.endDate);
    }

    return Payment.find(filter).sort({ date: -1, createdAt: -1 });
  }
}

export const paymentService = new PaymentService();
