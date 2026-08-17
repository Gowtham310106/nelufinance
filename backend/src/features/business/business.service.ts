// src/features/business/business.service.ts
import { Types } from 'mongoose';
import { Business, IBusiness } from '../../models/business.model';
import { User } from '../../models/user.model';
import { CreateBusinessInput, UpdateBusinessInput } from './business.validators';

export class BusinessService {
  /**
   * Create a new business and link it to the owner's user account.
   */
  async create(ownerId: string, input: CreateBusinessInput): Promise<IBusiness> {
    // Check if user already has a business
    const existingBusiness = await Business.findOne({
      ownerId: new Types.ObjectId(ownerId),
    });
    if (existingBusiness) {
      throw Object.assign(new Error('You already have a business registered'), { status: 409 });
    }

    const business = await Business.create({
      ...input,
      ownerId: new Types.ObjectId(ownerId),
    });

    // Update user with businessId
    await User.findByIdAndUpdate(ownerId, {
      businessId: business._id,
    });

    return business;
  }

  /**
   * Get business by ID (with ownership check).
   */
  async getById(businessId: string, userId: string): Promise<IBusiness | null> {
    return Business.findOne({
      _id: new Types.ObjectId(businessId),
      $or: [
        { ownerId: new Types.ObjectId(userId) },
        // Employees will be checked separately when Employee model is in place
      ],
    });
  }

  /**
   * Get all businesses owned by a user.
   */
  async getByOwner(ownerId: string): Promise<IBusiness[]> {
    return Business.find({ ownerId: new Types.ObjectId(ownerId), active: true });
  }

  /**
   * Update business settings.
   */
  async update(
    businessId: string,
    ownerId: string,
    input: UpdateBusinessInput,
  ): Promise<IBusiness | null> {
    const business = await Business.findOne({
      _id: new Types.ObjectId(businessId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!business) {
      throw Object.assign(new Error('Business not found or access denied'), { status: 404 });
    }

    // Deep merge settings if provided
    if (input.settings) {
      const currentSettings = (business.settings as any).toObject
        ? (business.settings as any).toObject()
        : business.settings;
      input.settings = {
        ...currentSettings,
        ...input.settings,
        interestConfig: {
          ...currentSettings.interestConfig,
          ...(input.settings.interestConfig || {}),
        },
        reconciliationThresholds: {
          ...currentSettings.reconciliationThresholds,
          ...(input.settings.reconciliationThresholds || {}),
        },
      } as any;
    }

    return Business.findByIdAndUpdate(businessId, { $set: input }, { new: true });
  }
}

export const businessService = new BusinessService();
