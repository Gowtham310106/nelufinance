// src/features/customers/customer.service.ts
import { Types } from 'mongoose';
import { Customer, ICustomer } from '../../models/customer.model';
import { Sale } from '../../models/sale.model';
import { Payment } from '../../models/payment.model';
import { createAuditLog } from '../../services/audit.service';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.validators';

export interface CustomerLedgerEntry {
  id: string;
  date: Date;
  type: 'OPENING_BALANCE' | 'SALE' | 'PAYMENT_RECEIVED';
  transactionNumber?: string;
  description: string;
  debitPaise: number;  // Increases balance owed (Sale, Opening)
  creditPaise: number; // Decreases balance owed (Payment)
  runningBalancePaise: number;
}

export class CustomerService {
  async create(businessId: string, userId: string, input: CreateCustomerInput): Promise<ICustomer> {
    const openingPaise = input.openingBalancePaise || 0;

    const customer = await Customer.create({
      businessId: new Types.ObjectId(businessId),
      name: input.name,
      phone: input.phone,
      address: input.address || '',
      openingBalancePaise: openingPaise,
      currentBalancePaise: openingPaise,
      interestRate: input.interestRate || 0,
      notes: input.notes || '',
      active: true,
    });

    await createAuditLog({
      businessId,
      userId,
      action: 'customer.create',
      entityType: 'Customer',
      entityId: (customer._id as any).toString(),
      changes: [{ field: 'name', oldValue: null, newValue: customer.name }],
    });

    return customer;
  }

  async getAll(businessId: string, search?: string): Promise<ICustomer[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId), active: true };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { phone: regex }];
    }

    return Customer.find(filter).sort({ name: 1 });
  }

  async getById(businessId: string, customerId: string): Promise<ICustomer | null> {
    return Customer.findOne({
      _id: new Types.ObjectId(customerId),
      businessId: new Types.ObjectId(businessId),
    });
  }

  async update(
    businessId: string,
    userId: string,
    customerId: string,
    input: UpdateCustomerInput
  ): Promise<ICustomer | null> {
    const updated = await Customer.findOneAndUpdate(
      {
        _id: new Types.ObjectId(customerId),
        businessId: new Types.ObjectId(businessId),
      },
      { $set: input },
      { new: true }
    );

    if (updated) {
      await createAuditLog({
        businessId,
        userId,
        action: 'customer.update',
        entityType: 'Customer',
        entityId: customerId,
        reason: 'Customer details updated',
      });
    }

    return updated;
  }

  async getLedger(businessId: string, customerId: string): Promise<{
    customer: ICustomer;
    entries: CustomerLedgerEntry[];
    totalDebitPaise: number;
    totalCreditPaise: number;
    finalBalancePaise: number;
  }> {
    const customer = await Customer.findOne({
      _id: new Types.ObjectId(customerId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!customer) {
      throw Object.assign(new Error('Customer not found'), { status: 404 });
    }

    // 1. Sales made to this customer
    const sales = await Sale.find({
      businessId: new Types.ObjectId(businessId),
      customerId: new Types.ObjectId(customerId),
    }).sort({ date: 1 });

    // 2. Payments received from this customer
    const payments = await Payment.find({
      businessId: new Types.ObjectId(businessId),
      partyType: 'CUSTOMER',
      partyId: new Types.ObjectId(customerId),
      type: 'RECEIVED',
    }).sort({ date: 1 });

    const rawEntries: {
      date: Date;
      type: 'OPENING_BALANCE' | 'SALE' | 'PAYMENT_RECEIVED';
      id: string;
      transactionNumber?: string;
      description: string;
      debitPaise: number;
      creditPaise: number;
    }[] = [];

    // Opening Balance
    if (customer.openingBalancePaise > 0) {
      rawEntries.push({
        date: customer.createdAt,
        type: 'OPENING_BALANCE',
        id: 'opening',
        description: 'Opening Balance',
        debitPaise: customer.openingBalancePaise,
        creditPaise: 0,
      });
    }

    // Sales entries
    for (const s of sales) {
      const itemsSummary = s.items.map((i) => `${i.productName} (${i.quantityKg}kg)`).join(', ');
      rawEntries.push({
        date: s.date,
        type: 'SALE',
        id: (s._id as any).toString(),
        transactionNumber: s.transactionNumber,
        description: `Sale: ${itemsSummary}`,
        debitPaise: s.totalAmountPaise,
        creditPaise: s.receivedAmountPaise, // If any cash paid during sale, it credits the debit immediately
      });
    }

    // Direct Payment entries (payments recorded outside of immediate sale point)
    for (const p of payments) {
      rawEntries.push({
        date: p.date,
        type: 'PAYMENT_RECEIVED',
        id: (p._id as any).toString(),
        transactionNumber: p.transactionNumber,
        description: `Payment Received (${p.paymentMethod.toUpperCase()})${p.notes ? `: ${p.notes}` : ''}`,
        debitPaise: 0,
        creditPaise: p.amountPaise,
      });
    }

    // Sort all entries chronologically
    rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime());

    // Calculate running balances
    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const entries: CustomerLedgerEntry[] = rawEntries.map((e) => {
      runningBalance += e.debitPaise - e.creditPaise;
      totalDebit += e.debitPaise;
      totalCredit += e.creditPaise;

      return {
        ...e,
        runningBalancePaise: runningBalance,
      };
    });

    return {
      customer,
      entries,
      totalDebitPaise: totalDebit,
      totalCreditPaise: totalCredit,
      finalBalancePaise: runningBalance,
    };
  }

  async calculateVatti(
    businessId: string,
    customerId: string,
    ratePerHundredPerMonth: number,
    asOfDateStr?: string
  ) {
    const customer = await Customer.findOne({
      _id: new Types.ObjectId(customerId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!customer) {
      throw Object.assign(new Error('Customer not found'), { status: 404 });
    }

    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();
    const rate = ratePerHundredPerMonth || customer.interestRate || 2.0;

    // Get unpaid sales with credit balances
    const creditSales = await Sale.find({
      businessId: new Types.ObjectId(businessId),
      customerId: new Types.ObjectId(customerId),
      creditAmountPaise: { $gt: 0 },
    }).sort({ date: 1 });

    let totalInterestPaise = 0;
    const breakdown: {
      date: Date;
      transactionNumber?: string;
      description: string;
      principalPaise: number;
      days: number;
      months: number;
      interestPaise: number;
    }[] = [];

    for (const s of creditSales) {
      const saleDate = new Date(s.date);
      const diffMs = Math.max(0, asOfDate.getTime() - saleDate.getTime());
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const months = Math.round((days / 30) * 100) / 100;

      // Simple Interest = Principal * (Rate / 100) * (days / 30)
      const interestPaise = Math.round(s.creditAmountPaise * (rate / 100) * (days / 30));
      totalInterestPaise += interestPaise;

      breakdown.push({
        date: s.date,
        transactionNumber: s.transactionNumber,
        description: s.items.map((i) => i.productName).join(', '),
        principalPaise: s.creditAmountPaise,
        days,
        months,
        interestPaise,
      });
    }

    const principalPaise = customer.currentBalancePaise || 0;
    // If there were no discrete credit sales found (e.g. from opening balance), compute directly on current balance
    if (breakdown.length === 0 && principalPaise > 0) {
      const custCreated = new Date(customer.createdAt);
      const diffMs = Math.max(0, asOfDate.getTime() - custCreated.getTime());
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const months = Math.round((days / 30) * 100) / 100;
      totalInterestPaise = Math.round(principalPaise * (rate / 100) * (days / 30));

      breakdown.push({
        date: customer.createdAt,
        description: 'Opening / Ledger Balance',
        principalPaise,
        days,
        months,
        interestPaise: totalInterestPaise,
      });
    }

    const totalDuePaise = principalPaise + totalInterestPaise;

    return {
      customer,
      principalPaise,
      monthlyRate: rate,
      asOfDate,
      totalInterestPaise,
      totalDuePaise,
      breakdown,
    };
  }
}

export const customerService = new CustomerService();
