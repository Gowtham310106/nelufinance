// src/features/adaku/adaku.service.ts
import { Types } from 'mongoose';
import { AdakuKadan, IAdakuKadan, IAdakuImage, AdakuStatus } from '../../models/adaku-kadan.model';
import { AdakuPayment, IAdakuPayment } from '../../models/adaku-payment.model';
import { Customer } from '../../models/customer.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import { uploadService } from '../upload/upload.service';
import { CreateAdakuInput, CreateAdakuPaymentInput } from './adaku.validators';
import { assertObjectId, parseDateBound, searchRegex } from '../../utils/query';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSED_STATUSES: AdakuStatus[] = ['REDEEMED', 'AUCTIONED'];

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

type PaymentLike = Pick<IAdakuPayment, 'type' | 'principalAmountPaise' | 'interestAmountPaise' | 'date'>;

/**
 * Principal originally lent, reconstructed from the current outstanding balance plus
 * principal repaid. (Older FULL_REDEMPTION records did not zero loanAmountPaise, so their
 * principal is only added back when the balance was actually zeroed.)
 */
export function originalPrincipalPaise(
  pledge: Pick<IAdakuKadan, 'loanAmountPaise'>,
  payments: PaymentLike[]
): number {
  let repaid = 0;
  for (const p of payments) {
    if (p.type === 'PRINCIPAL_REDUCTION') repaid += p.principalAmountPaise || 0;
    else if (p.type === 'FULL_REDEMPTION' && pledge.loanAmountPaise === 0) {
      repaid += p.principalAmountPaise || 0;
    }
  }
  return pledge.loanAmountPaise + repaid;
}

/**
 * Accrue simple monthly vatti segment by segment: each principal reduction only lowers
 * the principal from its payment date onwards, so earlier periods are charged on the
 * higher balance that was actually outstanding then.
 */
function accrueInterest(pledge: IAdakuKadan, payments: PaymentLike[], asOfDate: Date) {
  const start = new Date(pledge.pledgeDate).getTime();
  const dayIndex = (d: Date) => Math.max(0, Math.floor((new Date(d).getTime() - start) / DAY_MS));
  const totalDays = dayIndex(asOfDate);
  const monthlyRate = pledge.monthlyVattiRate / 100;

  let principal = originalPrincipalPaise(pledge, payments);
  let lastDay = 0;
  let interest = 0;
  let interestPaid = 0;

  const history = [...payments]
    .filter((p) => new Date(p.date).getTime() <= asOfDate.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const p of history) {
    interestPaid += p.interestAmountPaise || 0;
    const day = Math.min(dayIndex(p.date), totalDays);
    interest += principal * monthlyRate * ((day - lastDay) / 30);
    lastDay = day;
    if (p.type === 'PRINCIPAL_REDUCTION') {
      principal = Math.max(0, principal - (p.principalAmountPaise || 0));
    } else if (p.type === 'FULL_REDEMPTION') {
      principal = 0;
    }
  }
  interest += principal * monthlyRate * ((totalDays - lastDay) / 30);

  return {
    days: totalDays,
    principalPaise: principal,
    grossInterestPaise: Math.round(interest),
    interestPaidPaise: interestPaid,
  };
}

export class AdakuService {
  async create(
    businessId: string,
    userId: string,
    input: CreateAdakuInput,
    imageFiles?: Express.Multer.File[]
  ): Promise<IAdakuKadan> {
    // All checks happen before images are uploaded so a rejected request leaves no orphaned files
    if (input.customerId) {
      const customer = await Customer.exists({
        _id: new Types.ObjectId(input.customerId),
        businessId: new Types.ObjectId(businessId),
      });
      if (!customer) throw httpError('Customer not found', 404);
    }

    const pledgeDate = input.pledgeDate ? parseDateBound(input.pledgeDate, 'start') : new Date();
    // Default due date = 12 months after pledge date
    const dueDate = input.dueDate
      ? parseDateBound(input.dueDate, 'end')
      : new Date(new Date(pledgeDate).setFullYear(pledgeDate.getFullYear() + 1));
    if (dueDate.getTime() <= pledgeDate.getTime()) {
      throw httpError('Due date must be after the pledge date', 400);
    }

    const pledgeNumber = await generateTransactionNumber(businessId, 'ADK');

    // Process & compress uploaded images using Sharp (up to 5 photos)
    let images: IAdakuImage[] = [];
    if (imageFiles && imageFiles.length > 0) {
      images = await uploadService.processMultipleImages(imageFiles, businessId);
    }

    const netWeight = Math.max(0, input.grossWeightGrams - (input.stoneWeightGrams ?? 0));

    const adaku = await AdakuKadan.create({
      businessId: new Types.ObjectId(businessId),
      pledgeNumber,
      customerId: input.customerId ? new Types.ObjectId(input.customerId) : undefined,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerAadhaar: input.customerAadhaar || '',
      customerAddress: input.customerAddress || '',
      itemType: input.itemType,
      purityKarat: input.purityKarat,
      itemDescription: input.itemDescription,
      itemCount: input.itemCount ?? 1,
      grossWeightGrams: input.grossWeightGrams,
      stoneWeightGrams: input.stoneWeightGrams ?? 0,
      netWeightGrams: netWeight,
      marketValuePaise: input.marketValuePaise ?? 0,
      loanAmountPaise: input.loanAmountPaise,
      monthlyVattiRate: input.monthlyVattiRate ?? 2.0,
      lockerNumber: input.lockerNumber || '',
      images,
      status: 'ACTIVE',
      pledgeDate,
      dueDate,
      totalInterestPaidPaise: 0,
      notes: input.notes || '',
      recordedBy: new Types.ObjectId(userId),
    });

    await createAuditLog({
      businessId,
      userId,
      action: 'adaku.create',
      entityType: 'AdakuKadan',
      entityId: (adaku._id as any).toString(),
      changes: [
        { field: 'pledgeNumber', oldValue: null, newValue: pledgeNumber },
        { field: 'loanAmountPaise', oldValue: null, newValue: input.loanAmountPaise },
        { field: 'netWeightGrams', oldValue: null, newValue: netWeight },
      ],
      reason: `Created Adaku pawn loan ${pledgeNumber} for ${input.customerName} (₹${(input.loanAmountPaise / 100).toFixed(2)}, ${netWeight}g)`,
    });

    return adaku;
  }

  async getAll(
    businessId: string,
    options: { status?: string; search?: string } = {}
  ): Promise<IAdakuKadan[]> {
    await this.markOverdue(businessId);
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.status && options.status !== 'all') {
      filter.status = String(options.status);
    }

    if (options.search) {
      const regex = searchRegex(String(options.search));
      filter.$or = [
        { customerName: regex },
        { customerPhone: regex },
        { pledgeNumber: regex },
        { lockerNumber: regex },
        { itemDescription: regex },
      ];
    }

    return AdakuKadan.find(filter).sort({ pledgeDate: -1, createdAt: -1 });
  }

  async getById(
    businessId: string,
    id: string
  ): Promise<{ pledge: IAdakuKadan; payments: IAdakuPayment[] } | null> {
    assertObjectId(id, 'pledge id');
    await this.markOverdue(businessId);
    const pledge = await AdakuKadan.findOne({
      _id: new Types.ObjectId(id),
      businessId: new Types.ObjectId(businessId),
    });

    if (!pledge) return null;

    const payments = await AdakuPayment.find({
      businessId: new Types.ObjectId(businessId),
      adakuId: new Types.ObjectId(id),
    }).sort({ date: -1 });

    return { pledge, payments };
  }

  async calculateInterest(businessId: string, id: string, asOfDateStr?: string) {
    assertObjectId(id, 'pledge id');
    const asOfDate = asOfDateStr ? parseDateBound(asOfDateStr, 'end') : new Date();

    const pledge = await AdakuKadan.findOne({
      _id: new Types.ObjectId(id),
      businessId: new Types.ObjectId(businessId),
    });

    if (!pledge) {
      throw httpError('Pledge loan not found', 404);
    }

    const payments = await AdakuPayment.find({
      businessId: new Types.ObjectId(businessId),
      adakuId: pledge._id,
    }).select('type principalAmountPaise interestAmountPaise date');

    // Monthly Vatti Interest = Σ Principal outstanding in segment * (Rate / 100) * (segment days / 30)
    const { days, principalPaise, grossInterestPaise, interestPaidPaise } = accrueInterest(
      pledge,
      payments,
      asOfDate
    );
    const months = Math.round((days / 30) * 100) / 100;

    const pendingInterestPaise = Math.max(0, grossInterestPaise - interestPaidPaise);
    const totalRedemptionAmountPaise = principalPaise + pendingInterestPaise;

    return {
      pledge,
      asOfDate,
      days,
      months,
      principalPaise,
      monthlyVattiRate: pledge.monthlyVattiRate,
      grossInterestPaise,
      totalInterestPaidPaise: interestPaidPaise,
      pendingInterestPaise,
      totalRedemptionAmountPaise,
    };
  }

  async recordPayment(
    businessId: string,
    userId: string,
    id: string,
    input: CreateAdakuPaymentInput
  ): Promise<IAdakuPayment> {
    assertObjectId(id, 'pledge id');
    const pledge = await AdakuKadan.findOne({
      _id: new Types.ObjectId(id),
      businessId: new Types.ObjectId(businessId),
    });

    if (!pledge) {
      throw httpError('Pledge loan not found', 404);
    }

    if (CLOSED_STATUSES.includes(pledge.status)) {
      throw httpError(`Pledge ${pledge.pledgeNumber} is ${pledge.status}; no further payments can be recorded`, 400);
    }

    const paymentDate = input.date ? parseDateBound(input.date, 'start') : new Date();
    const outstandingPaise = pledge.loanAmountPaise;
    const interestAmountPaise = input.interestAmountPaise ?? 0;
    let principalAmountPaise = input.principalAmountPaise ?? 0;
    const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

    if (input.type === 'INTEREST_ONLY') {
      principalAmountPaise = 0; // interest-only payments never touch principal
      if (interestAmountPaise <= 0) throw httpError('Interest amount must be greater than 0', 400);
    } else if (input.type === 'PRINCIPAL_REDUCTION') {
      if (principalAmountPaise <= 0) throw httpError('Principal amount must be greater than 0', 400);
      if (principalAmountPaise > outstandingPaise) {
        throw httpError(
          `Principal amount ${rupees(principalAmountPaise)} exceeds outstanding principal ${rupees(outstandingPaise)}`,
          400
        );
      }
    } else if (input.type === 'FULL_REDEMPTION') {
      if (principalAmountPaise === 0) principalAmountPaise = outstandingPaise;
      if (principalAmountPaise !== outstandingPaise) {
        throw httpError(
          `Full redemption must repay the outstanding principal of ${rupees(outstandingPaise)}`,
          400
        );
      }
    }

    const totalPaidPaise = interestAmountPaise + principalAmountPaise;
    if (totalPaidPaise <= 0) throw httpError('Payment amount must be greater than 0', 400);

    const remainingPaise = outstandingPaise - principalAmountPaise;
    const updateOps: any = {
      $inc: {
        totalInterestPaidPaise: interestAmountPaise,
        loanAmountPaise: -principalAmountPaise,
      },
    };

    if (remainingPaise === 0) {
      updateOps.$set = { status: 'REDEEMED', redeemedDate: paymentDate };
    } else if (principalAmountPaise > 0) {
      const overdue = pledge.dueDate && new Date(pledge.dueDate).getTime() < Date.now();
      updateOps.$set = { status: overdue ? 'OVERDUE' : 'PARTIALLY_PAID' };
    }

    // Guard against concurrent payments: only apply if the pledge is still open at the balance we validated
    const updated = await AdakuKadan.findOneAndUpdate(
      {
        _id: pledge._id,
        businessId: new Types.ObjectId(businessId),
        status: { $nin: CLOSED_STATUSES },
        loanAmountPaise: outstandingPaise,
      },
      updateOps,
      { returnDocument: 'after' }
    );
    if (!updated) {
      throw httpError('Pledge was updated by another payment; please refresh and try again', 409);
    }

    const receiptNumber = await generateTransactionNumber(businessId, 'ADR');
    const payment = await AdakuPayment.create({
      businessId: new Types.ObjectId(businessId),
      receiptNumber,
      adakuId: pledge._id,
      pledgeNumber: pledge.pledgeNumber,
      customerName: pledge.customerName,
      type: input.type,
      interestAmountPaise,
      principalAmountPaise,
      totalPaidPaise,
      monthsCovered: input.monthsCovered,
      paymentMethod: input.paymentMethod,
      notes: input.notes || '',
      date: paymentDate,
      recordedBy: new Types.ObjectId(userId),
    });

    await createAuditLog({
      businessId,
      userId,
      action: 'adaku.payment',
      entityType: 'AdakuPayment',
      entityId: (payment._id as any).toString(),
      changes: [{ field: 'totalPaidPaise', oldValue: null, newValue: totalPaidPaise }],
      reason: `Recorded ${input.type} payment ${receiptNumber} of ₹${(totalPaidPaise / 100).toFixed(2)} on pledge ${pledge.pledgeNumber}`,
    });

    return payment;
  }

  /**
   * Flag open pledges whose due date has passed as OVERDUE (they remain "active" loans).
   */
  async markOverdue(businessId: string): Promise<void> {
    await AdakuKadan.updateMany(
      {
        businessId: new Types.ObjectId(businessId),
        status: { $in: ['ACTIVE', 'PARTIALLY_PAID'] },
        dueDate: { $lt: new Date() },
      },
      { $set: { status: 'OVERDUE' } }
    );
  }

  async getSummary(businessId: string) {
    await this.markOverdue(businessId);
    const bId = new Types.ObjectId(businessId);
    const activePledges = await AdakuKadan.find({
      businessId: bId,
      status: { $in: ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE'] },
    });

    let totalActiveLoansPaise = 0;
    let totalGoldGrams = 0;
    let totalSilverGrams = 0;
    let monthlyExpectedVattiPaise = 0;
    let overduePledgesCount = 0;

    for (const p of activePledges) {
      if (p.status === 'OVERDUE') overduePledgesCount++;
      totalActiveLoansPaise += p.loanAmountPaise;
      monthlyExpectedVattiPaise += Math.round(p.loanAmountPaise * (p.monthlyVattiRate / 100));

      if (p.itemType === 'gold') {
        totalGoldGrams += p.netWeightGrams;
      } else if (p.itemType === 'silver') {
        totalSilverGrams += p.netWeightGrams;
      }
    }

    return {
      activePledgesCount: activePledges.length,
      overduePledgesCount,
      totalActiveLoansPaise,
      totalGoldGrams,
      totalGoldPavan: Math.round((totalGoldGrams / 8) * 100) / 100, // 1 Pavan = 8 grams
      totalSilverGrams,
      monthlyExpectedVattiPaise,
    };
  }
}

export const adakuService = new AdakuService();
