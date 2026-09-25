// src/features/daily-closing/daily-closing.service.ts
import { Model, Types } from 'mongoose';
import { DailyClosing, IDailyClosing } from '../../models/daily-closing.model';
import { Sale } from '../../models/sale.model';
import { Payment } from '../../models/payment.model';
import { Expense } from '../../models/expense.model';
import { Purchase } from '../../models/purchase.model';
import { EmployeeAdvance } from '../../models/employee-advance.model';
import { AdakuKadan } from '../../models/adaku-kadan.model';
import { AdakuPayment } from '../../models/adaku-payment.model';
import { originalPrincipalPaise } from '../adaku/adaku.service';
import { createAuditLog } from '../../services/audit.service';
import { istDayRange, todayIst } from '../../utils/query';
import { SubmitDailyClosingInput } from './daily-closing.validators';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

async function sumPaise(
  model: Model<any>,
  match: Record<string, unknown>,
  field: string
): Promise<number> {
  const [row] = await model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return row?.total ?? 0;
}

export interface DailyClosingPreview {
  closingDate: string;
  openingCashPaise: number;
  cashSalesPaise: number;
  cashPaymentsReceivedPaise: number;
  cashPaymentsGivenPaise: number;
  cashExpensesPaise: number;
  purchaseCashOutPaise: number;
  advancesPaidPaise: number;
  adakuLoansOutPaise: number;
  adakuReceiptsPaise: number;
  expectedClosingCashPaise: number;
  alreadyClosed: boolean;
  existingClosing?: IDailyClosing;
}

export class DailyClosingService {
  async getPreview(businessId: string, dateStr?: string): Promise<DailyClosingPreview> {
    const bId = new Types.ObjectId(businessId);

    const targetDateStr = dateStr || todayIst();
    // Business day boundaries in IST (throws 400 on a malformed date)
    const { start: startOfDay, end: endOfDay } = istDayRange(targetDateStr);
    const today = { $gte: startOfDay, $lte: endOfDay };

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

    const cashMatch = { businessId: bId, paymentMethod: 'cash', date: today };

    const [
      cashSalesPaise,
      cashPaymentsReceivedPaise,
      cashPaymentsGivenPaise,
      cashExpensesPaise,
      purchaseCashOutPaise,
      advancesPaidPaise,
      adakuReceiptsPaise,
    ] = await Promise.all([
      // 3. Cash received at sale time (later credit collections arrive as Payment docs, counted below)
      sumPaise(Sale, cashMatch, 'receivedAmountPaise'),
      // 4. Cash Payments Received today
      sumPaise(Payment, { ...cashMatch, type: 'RECEIVED' }, 'amountPaise'),
      // 5. Cash Payments Given today
      sumPaise(Payment, { ...cashMatch, type: 'GIVEN' }, 'amountPaise'),
      // 6. Cash Expenses today (includes SALARY_PAID, which employees service records as an Expense)
      sumPaise(Expense, cashMatch, 'amountPaise'),
      // 7. Cash paid upfront on purchases (purchase service does not create Payment docs for this)
      sumPaise(Purchase, cashMatch, 'paidAmountPaise'),
      // 8. Employee advances handed out in cash (ADVANCE_DEDUCTED is a salary offset, not cash)
      sumPaise(EmployeeAdvance, { ...cashMatch, type: 'ADVANCE_GIVEN' }, 'amountPaise'),
      // 9. Cash vatti / principal collected on pawn loans
      sumPaise(AdakuPayment, cashMatch, 'totalPaidPaise'),
    ]);

    // 10. Pawn loans paid out today (pledges have no payment method; disbursed from the drawer).
    // loanAmountPaise shrinks as principal is repaid, so use the originally lent amount.
    const pledgesToday = await AdakuKadan.find({ businessId: bId, pledgeDate: today }).select(
      'loanAmountPaise'
    );
    let adakuLoansOutPaise = 0;
    if (pledgesToday.length > 0) {
      const pledgePayments = await AdakuPayment.find({
        businessId: bId,
        adakuId: { $in: pledgesToday.map((p) => p._id) },
      }).select('adakuId type principalAmountPaise interestAmountPaise date');
      for (const pledge of pledgesToday) {
        const own = pledgePayments.filter((p) => p.adakuId.equals(pledge._id as Types.ObjectId));
        adakuLoansOutPaise += originalPrincipalPaise(pledge, own);
      }
    }

    // 11. Expected Closing Cash
    const expectedClosingCashPaise =
      openingCashPaise +
      cashSalesPaise +
      cashPaymentsReceivedPaise +
      adakuReceiptsPaise -
      cashPaymentsGivenPaise -
      cashExpensesPaise -
      purchaseCashOutPaise -
      advancesPaidPaise -
      adakuLoansOutPaise;

    return {
      closingDate: targetDateStr,
      openingCashPaise,
      cashSalesPaise,
      cashPaymentsReceivedPaise,
      cashPaymentsGivenPaise,
      cashExpensesPaise,
      purchaseCashOutPaise,
      advancesPaidPaise,
      adakuLoansOutPaise,
      adakuReceiptsPaise,
      expectedClosingCashPaise,
      alreadyClosed: !!existing,
      existingClosing: existing || undefined,
    };
  }

  async submitClosing(
    businessId: string,
    userId: string,
    userRole: string,
    input: SubmitDailyClosingInput
  ): Promise<IDailyClosing> {
    const preview = await this.getPreview(businessId, input.closingDate);
    const existing = preview.existingClosing;

    if (existing?.status === 'LOCKED') {
      throw httpError(`Closing for ${input.closingDate} is locked and cannot be changed`, 409);
    }
    if (existing?.status === 'CLOSED' && userRole !== 'owner') {
      throw httpError(`${input.closingDate} is already closed; only the owner can re-close it`, 403);
    }

    // Owner may override opening cash; expected cash is recomputed from whichever is used
    const openingCashPaise = input.openingCashPaise ?? preview.openingCashPaise;
    const expectedClosingCashPaise =
      preview.expectedClosingCashPaise - preview.openingCashPaise + openingCashPaise;

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
    const cashVariancePaise = actualCashInDrawerPaise - expectedClosingCashPaise;

    const closing = await DailyClosing.findOneAndUpdate(
      {
        businessId: new Types.ObjectId(businessId),
        closingDate: input.closingDate,
        // A LOCKED row never matches, so a concurrent lock makes the upsert fail (409) instead of overwriting
        status: { $ne: 'LOCKED' },
      },
      {
        $set: {
          openingCashPaise,
          cashSalesPaise: preview.cashSalesPaise,
          cashPaymentsReceivedPaise: preview.cashPaymentsReceivedPaise,
          cashPaymentsGivenPaise: preview.cashPaymentsGivenPaise,
          cashExpensesPaise: preview.cashExpensesPaise,
          purchaseCashOutPaise: preview.purchaseCashOutPaise,
          advancesPaidPaise: preview.advancesPaidPaise,
          adakuLoansOutPaise: preview.adakuLoansOutPaise,
          adakuReceiptsPaise: preview.adakuReceiptsPaise,
          expectedClosingCashPaise,
          actualCashInDrawerPaise,
          cashVariancePaise,
          denominations: input.denominations,
          status: 'CLOSED',
          notes: input.notes || '',
          closedBy: new Types.ObjectId(userId),
          closedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    await createAuditLog({
      businessId,
      userId,
      action: 'daily_closing.submit',
      entityType: 'DailyClosing',
      entityId: (closing._id as any).toString(),
      changes: [
        {
          field: 'actualCashInDrawerPaise',
          oldValue: existing?.actualCashInDrawerPaise ?? null,
          newValue: actualCashInDrawerPaise,
        },
        {
          field: 'cashVariancePaise',
          oldValue: existing?.cashVariancePaise ?? null,
          newValue: cashVariancePaise,
        },
      ],
      reason: `${existing ? 'Re-submitted' : 'Submitted'} daily closing for ${input.closingDate} with variance ₹${(cashVariancePaise / 100).toFixed(2)}`,
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
