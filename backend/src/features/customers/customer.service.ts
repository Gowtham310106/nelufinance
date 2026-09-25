// src/features/customers/customer.service.ts
import { Types } from 'mongoose';
import { Customer, ICustomer } from '../../models/customer.model';
import { Sale } from '../../models/sale.model';
import { Payment } from '../../models/payment.model';
import { createAuditLog } from '../../services/audit.service';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.validators';
import { searchRegex } from '../../utils/query';

export interface CustomerLedgerEntry {
  id: string;
  date: Date;
  type: 'OPENING_BALANCE' | 'SALE' | 'PAYMENT_RECEIVED' | 'PAYMENT_GIVEN';
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
      const regex = searchRegex(search);
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
      { returnDocument: 'after' }
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

    // 2. Payments received from / given to this customer
    const payments = await Payment.find({
      businessId: new Types.ObjectId(businessId),
      partyType: 'CUSTOMER',
      partyId: new Types.ObjectId(customerId),
    }).sort({ date: 1 });

    const rawEntries: {
      date: Date;
      type: 'OPENING_BALANCE' | 'SALE' | 'PAYMENT_RECEIVED' | 'PAYMENT_GIVEN';
      id: string;
      transactionNumber?: string;
      description: string;
      debitPaise: number;
      creditPaise: number;
    }[] = [];

    // Opening Balance
    if (customer.openingBalancePaise) {
      // A negative opening balance is an advance held for the customer
      rawEntries.push({
        date: customer.createdAt,
        type: 'OPENING_BALANCE',
        id: 'opening',
        description: 'Opening Balance',
        debitPaise: Math.max(0, customer.openingBalancePaise),
        creditPaise: Math.max(0, -customer.openingBalancePaise),
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
      const received = p.type === 'RECEIVED';
      rawEntries.push({
        date: p.date,
        type: received ? 'PAYMENT_RECEIVED' : 'PAYMENT_GIVEN',
        id: (p._id as any).toString(),
        transactionNumber: p.transactionNumber,
        description: `${received ? 'Payment Received' : 'Payment Given'} (${p.paymentMethod.toUpperCase()})${p.notes ? `: ${p.notes}` : ''}`,
        debitPaise: received ? 0 : p.amountPaise,
        creditPaise: received ? p.amountPaise : 0,
      });
    }

    // Sort all entries chronologically (stable, so same-day entries keep insertion order)
    rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
    ratePerHundredPerMonth: number | undefined,
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
    if (isNaN(asOfDate.getTime())) {
      throw Object.assign(new Error('Invalid asOfDate'), { status: 400 });
    }
    // An explicit rate (even 0) wins; otherwise the customer's own rate, else the 2% default
    const rate: number =
      ratePerHundredPerMonth ?? ((customer.interestRate ?? 0) > 0 ? customer.interestRate! : 2.0);
    if (!Number.isFinite(rate) || rate < 0) {
      throw Object.assign(new Error('Invalid interest rate'), { status: 400 });
    }

    // Everything that increased the customer's balance: opening balance, credit on sales,
    // and money given to the customer.
    const [creditSales, givenPayments] = await Promise.all([
      Sale.find({
        businessId: new Types.ObjectId(businessId),
        customerId: new Types.ObjectId(customerId),
        creditAmountPaise: { $gt: 0 },
      }).sort({ date: 1 }),
      Payment.find({
        businessId: new Types.ObjectId(businessId),
        partyType: 'CUSTOMER',
        partyId: new Types.ObjectId(customerId),
        type: 'GIVEN',
      }).sort({ date: 1 }),
    ]);

    const lots: { date: Date; transactionNumber?: string; description: string; amountPaise: number }[] = [];
    if (customer.openingBalancePaise > 0) {
      lots.push({
        date: customer.createdAt,
        description: 'Opening Balance',
        amountPaise: customer.openingBalancePaise,
      });
    }
    for (const s of creditSales) {
      lots.push({
        date: s.date,
        transactionNumber: s.transactionNumber,
        description: s.items.map((i) => i.productName).join(', '),
        amountPaise: s.creditAmountPaise,
      });
    }
    for (const p of givenPayments) {
      lots.push({
        date: p.date,
        transactionNumber: p.transactionNumber,
        description: 'Payment Given',
        amountPaise: p.amountPaise,
      });
    }
    lots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Payments settle the oldest dues first (FIFO), so whatever is still outstanding is the
    // most recent part of the debt. Walk newest → oldest assigning the current balance.
    const principalPaise = Math.max(0, customer.currentBalancePaise || 0);
    let unallocated = principalPaise;
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

    const addLine = (lot: { date: Date; transactionNumber?: string; description: string }, amount: number) => {
      const diffMs = Math.max(0, asOfDate.getTime() - new Date(lot.date).getTime());
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const months = Math.round((days / 30) * 100) / 100;
      // Simple Interest = Principal * (Rate / 100) * (days / 30)
      const interestPaise = Math.round(amount * (rate / 100) * (days / 30));
      totalInterestPaise += interestPaise;
      breakdown.unshift({
        date: lot.date,
        transactionNumber: lot.transactionNumber,
        description: lot.description,
        principalPaise: amount,
        days,
        months,
        interestPaise,
      });
    };

    for (let i = lots.length - 1; i >= 0 && unallocated > 0; i--) {
      const amount = Math.min(lots[i].amountPaise, unallocated);
      addLine(lots[i], amount);
      unallocated -= amount;
    }
    // Balance not explained by any recorded transaction (e.g. legacy data)
    if (unallocated > 0) {
      addLine({ date: customer.createdAt, description: 'Opening / Ledger Balance' }, unallocated);
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
