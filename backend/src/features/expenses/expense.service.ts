// src/features/expenses/expense.service.ts
import { Types } from 'mongoose';
import { Expense, IExpense } from '../../models/expense.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import { CreateExpenseInput } from './expense.validators';

export class ExpenseService {
  async create(businessId: string, userId: string, input: CreateExpenseInput): Promise<IExpense> {
    const txnNumber = await generateTransactionNumber(businessId, 'EXP');
    const expenseDate = input.date ? new Date(input.date) : new Date();

    const expense = await Expense.create({
      businessId: new Types.ObjectId(businessId),
      transactionNumber: txnNumber,
      category: input.category,
      amountPaise: input.amountPaise,
      paymentMethod: input.paymentMethod,
      notes: input.notes || '',
      employeeId: new Types.ObjectId(userId),
      date: expenseDate,
    });

    await createAuditLog({
      businessId,
      userId,
      action: 'expense.create',
      entityType: 'Expense',
      entityId: (expense._id as any).toString(),
      changes: [
        { field: 'transactionNumber', oldValue: null, newValue: txnNumber },
        { field: 'amountPaise', oldValue: null, newValue: input.amountPaise },
        { field: 'category', oldValue: null, newValue: input.category },
      ],
      reason: `Recorded ${input.category} expense of ₹${(input.amountPaise / 100).toFixed(2)}`,
    });

    return expense;
  }

  async getAll(
    businessId: string,
    options: { category?: string; startDate?: string; endDate?: string } = {}
  ): Promise<IExpense[]> {
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.category && options.category !== 'all') {
      filter.category = options.category;
    }

    if (options.startDate || options.endDate) {
      filter.date = {};
      if (options.startDate) filter.date.$gte = new Date(options.startDate);
      if (options.endDate) filter.date.$lte = new Date(options.endDate);
    }

    return Expense.find(filter).sort({ date: -1, createdAt: -1 });
  }

  async delete(businessId: string, userId: string, expenseId: string): Promise<boolean> {
    const expense = await Expense.findOneAndDelete({
      _id: new Types.ObjectId(expenseId),
      businessId: new Types.ObjectId(businessId),
    });

    if (!expense) return false;

    await createAuditLog({
      businessId,
      userId,
      action: 'expense.delete',
      entityType: 'Expense',
      entityId: expenseId,
      reason: `Deleted expense ${expense.transactionNumber}`,
    });

    return true;
  }
}

export const expenseService = new ExpenseService();
