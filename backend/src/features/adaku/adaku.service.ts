// src/features/adaku/adaku.service.ts
import { Types } from 'mongoose';
import { AdakuKadan, IAdakuKadan, IAdakuImage, AdakuStatus } from '../../models/adaku-kadan.model';
import { AdakuPayment, IAdakuPayment } from '../../models/adaku-payment.model';
import { generateTransactionNumber } from '../../services/transaction-number.service';
import { createAuditLog } from '../../services/audit.service';
import { uploadService } from '../upload/upload.service';
import { CreateAdakuInput, CreateAdakuPaymentInput } from './adaku.validators';

export class AdakuService {
  async create(
    businessId: string,
    userId: string,
    input: CreateAdakuInput,
    imageFiles?: Express.Multer.File[]
  ): Promise<IAdakuKadan> {
    const pledgeNumber = await generateTransactionNumber(businessId, 'ADK');

    const pledgeDate = input.pledgeDate ? new Date(input.pledgeDate) : new Date();
    // Default due date = 12 months after pledge date
    const dueDate = input.dueDate
      ? new Date(input.dueDate)
      : new Date(new Date(pledgeDate).setFullYear(pledgeDate.getFullYear() + 1));

    // Process & compress uploaded images using Sharp (up to 5 photos)
    let images: IAdakuImage[] = [];
    if (imageFiles && imageFiles.length > 0) {
      images = await uploadService.processMultipleImages(imageFiles, businessId);
    }

    const netWeight = Math.max(0, input.grossWeightGrams - (input.stoneWeightGrams || 0));

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
      itemCount: input.itemCount || 1,
      grossWeightGrams: input.grossWeightGrams,
      stoneWeightGrams: input.stoneWeightGrams || 0,
      netWeightGrams: netWeight,
      marketValuePaise: input.marketValuePaise || 0,
      loanAmountPaise: input.loanAmountPaise,
      monthlyVattiRate: input.monthlyVattiRate || 2.0,
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
    const filter: any = { businessId: new Types.ObjectId(businessId) };

    if (options.status && options.status !== 'all') {
      filter.status = options.status;
    }

    if (options.search) {
      const regex = new RegExp(options.search, 'i');
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
    const pledge = await AdakuKadan.findOne({
      _id: new Types.ObjectId(id),
      businessId: new Types.ObjectId(businessId),
    });

    if (!pledge) {
      throw Object.assign(new Error('Pledge loan not found'), { status: 404 });
    }

    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();
    const pledgeDate = new Date(pledge.pledgeDate);

    // Days elapsed
    const diffMs = Math.max(0, asOfDate.getTime() - pledgeDate.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.round((days / 30) * 100) / 100;

    // Monthly Vatti Interest = Principal * (Rate / 100) * (days / 30)
    const grossInterestPaise = Math.round(
      pledge.loanAmountPaise * (pledge.monthlyVattiRate / 100) * (days / 30)
    );

    const pendingInterestPaise = Math.max(0, grossInterestPaise - pledge.totalInterestPaidPaise);
    const totalRedemptionAmountPaise = pledge.loanAmountPaise + pendingInterestPaise;

    return {
      pledge,
      asOfDate,
      days,
      months,
      principalPaise: pledge.loanAmountPaise,
      monthlyVattiRate: pledge.monthlyVattiRate,
      grossInterestPaise,
      totalInterestPaidPaise: pledge.totalInterestPaidPaise,
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
    const pledge = await AdakuKadan.findOne({
      _id: new Types.ObjectId(id),
      businessId: new Types.ObjectId(businessId),
    });

    if (!pledge) {
      throw Object.assign(new Error('Pledge loan not found'), { status: 404 });
    }

    const receiptNumber = await generateTransactionNumber(businessId, 'ADR');
    const paymentDate = input.date ? new Date(input.date) : new Date();
    const totalPaidPaise = (input.interestAmountPaise || 0) + (input.principalAmountPaise || 0);

    const payment = await AdakuPayment.create({
      businessId: new Types.ObjectId(businessId),
      receiptNumber,
      adakuId: pledge._id,
      pledgeNumber: pledge.pledgeNumber,
      customerName: pledge.customerName,
      type: input.type,
      interestAmountPaise: input.interestAmountPaise || 0,
      principalAmountPaise: input.principalAmountPaise || 0,
      totalPaidPaise,
      monthsCovered: input.monthsCovered,
      paymentMethod: input.paymentMethod,
      notes: input.notes || '',
      date: paymentDate,
      recordedBy: new Types.ObjectId(userId),
    });

    // Update Adaku record
    const updateOps: any = {
      $inc: {
        totalInterestPaidPaise: input.interestAmountPaise || 0,
      },
    };

    if (input.type === 'FULL_REDEMPTION') {
      updateOps.$set = {
        status: 'REDEEMED',
        redeemedDate: paymentDate,
      };
    } else if (input.type === 'PRINCIPAL_REDUCTION' && input.principalAmountPaise > 0) {
      updateOps.$inc.loanAmountPaise = -input.principalAmountPaise;
      updateOps.$set = { status: 'PARTIALLY_PAID' };
    }

    await AdakuKadan.findByIdAndUpdate(pledge._id, updateOps);

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

  async getSummary(businessId: string) {
    const bId = new Types.ObjectId(businessId);
    const activePledges = await AdakuKadan.find({
      businessId: bId,
      status: { $in: ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE'] },
    });

    let totalActiveLoansPaise = 0;
    let totalGoldGrams = 0;
    let totalSilverGrams = 0;
    let monthlyExpectedVattiPaise = 0;

    for (const p of activePledges) {
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
      totalActiveLoansPaise,
      totalGoldGrams,
      totalGoldPavan: Math.round((totalGoldGrams / 8) * 100) / 100, // 1 Pavan = 8 grams
      totalSilverGrams,
      monthlyExpectedVattiPaise,
    };
  }
}

export const adakuService = new AdakuService();
