// src/features/daily-closing/daily-closing.service.ts
import { Types } from 'mongoose';
import { DailyClosing, IDailyClosing, IDenominationCount } from '../../models/daily-closing.model';
import { Sale } from '../../models/sale.model';
import { Payment } from '../../models/payment.model';
import { Expense } from '../../models/expense.model';
import { createAuditLog } from '../../services/audit.service';
import { SubmitDailyClosingInput } from './daily-closing.validators';

export interface DailyClosingPreview {
  closingDate: string;
  openingCashPaise: number;
  cashSalesPaise: number;
  cashPaymentsReceivedPaise: number;
  cashPaymentsGivenPaise: number;
  cashExpensesPaise: number;
  expectedClosingCashPaise: number;
  alreadyClosed: boolean;
  existingClosing?: IDailyClosing;
}

export class DailyClosingService {
  async getPreview(businessId: string, dateStr?: string): Promise<DailyClosingPreview> {
    const bId = new Types.ObjectId(businessId);

    const targetDateStr = dateStr || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    // 1. Check if already closed
    const existing = await DailyClosing.findOne({
      businessId: bId,
      closingDate: targetDateStr,
    });

    // 2. Opening Cash (from previous day closing or default)
    let openingCashPaise = 0;
    if (existing) {
      openingCashPaise = existing.openingCashPaise;
    } else {
      const prevClosing = await DailyClosing.findOne({
        businessId: bId,
        closingDate: { $lt: targetDateStr },
      }).sort({ closingDate: -1 });

      if (prevClosing) {
        openingCashPaise = prevClosing.actualCashInDrawerPaise;
      }
    }

    // 3. Cash Sales today
    const sales = await Sale.find({
      businessId: bId,
      paymentMethod: 'cash',
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const cashSalesPaise = sales.reduce((sum, s) => sum + s.receivedAmountPaise, 0);

    // 4. Cash Payments Received today
    const paymentsReceived = await Payment.find({
      businessId: bId,
      type: 'RECEIVED',
      paymentMethod: 'cash',
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const cashPaymentsReceivedPaise = paymentsReceived.reduce((sum, p) => sum + p.amountPaise, 0);

    // 5. Cash Payments Given today
    const paymentsGiven = await Payment.find({
      businessId: bId,
      type: 'GIVEN',
      paymentMethod: 'cash',
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const cashPaymentsGivenPaise = paymentsGiven.reduce((sum, p) => sum + p.amountPaise, 0);

    // 6. Cash Expenses today
    const expenses = await Expense.find({
      businessId: bId,
      paymentMethod: 'cash',
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const cashExpensesPaise = expenses.reduce((sum, e) => sum + e.amountPaise, 0);

    // 7. Expected Closing Cash
    const expectedClosingCashPaise =
      openingCashPaise +
      cashSalesPaise +
      cashPaymentsReceivedPaise -
      cashPaymentsGivenPaise -
      cashExpensesPaise;

    return {
      closingDate: targetDateStr,
      openingCashPaise,
      cashSalesPaise,
      cashPaymentsReceivedPaise,
      cashPaymentsGivenPaise,
      cashExpensesPaise,
      expectedClosingCashPaise,
      alreadyClosed: !!existing,
      existingClosing: existing || undefined,
    };
  }

  async submitClosing(
    businessId: string,
    userId: string,
    input: SubmitDailyClosingInput
  ): Promise<IDailyClosing> {
    const preview = await this.getPreview(businessId, input.closingDate);

    // Calculate actual drawer cash from denomination counts (in paise)
    const { d500, d200, d100, d50, d20, d10, coins } = input.denominations;
    const actualRupees =
      d500 * 500 +
      d200 * 200 +
      d100 * 100 +
      d50 * 50 +
      d20 * 20 +
      d10 * 10 +
      coins * 1;

    const actualCashInDrawerPaise = actualRupees * 100;
    const cashVariancePaise = actualCashInDrawerPaise - preview.expectedClosingCashPaise;

    const closing = await DailyClosing.findOneAndUpdate(
      {
        businessId: new Types.ObjectId(businessId),
        closingDate: input.closingDate,
      },
      {
        $set: {
          openingCashPaise: input.openingCashPaise || preview.openingCashPaise,
          cashSalesPaise: preview.cashSalesPaise,
          cashPaymentsReceivedPaise: preview.cashPaymentsReceivedPaise,
          cashPaymentsGivenPaise: preview.cashPaymentsGivenPaise,
          cashExpensesPaise: preview.cashExpensesPaise,
          expectedClosingCashPaise: preview.expectedClosingCashPaise,
          actualCashInDrawerPaise,
          cashVariancePaise,
          denominations: input.denominations,
          status: 'CLOSED',
          notes: input.notes || '',
          closedBy: new Types.ObjectId(userId),
          closedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    await createAuditLog({
      businessId,
      userId,
      action: 'daily_closing.submit',
      entityType: 'DailyClosing',
      entityId: (closing._id as any).toString(),
      changes: [
        { field: 'actualCashInDrawerPaise', oldValue: null, newValue: actualCashInDrawerPaise },
        { field: 'cashVariancePaise', oldValue: null, newValue: cashVariancePaise },
      ],
      reason: `Submitted daily closing for ${input.closingDate} with variance ₹${(cashVariancePaise / 100).toFixed(2)}`,
    });

    return closing;
  }

  async getHistory(businessId: string): Promise<IDailyClosing[]> {
    return DailyClosing.find({
      businessId: new Types.ObjectId(businessId),
    })
      .populate('closedBy', 'name')
      .sort({ closingDate: -1 });
  }
}

export const dailyClosingService = new DailyClosingService();
