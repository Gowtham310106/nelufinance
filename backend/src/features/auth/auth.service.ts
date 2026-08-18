// src/features/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser } from '../../models/user.model';
import { Business } from '../../models/business.model';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.validators';
import { JwtPayload } from '../../middleware/auth.middleware';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export class AuthService {
  /**
   * Register a new user. Throws if phone already exists.
   * Automatically provisions initial shop/business entity.
   */
  async register(input: RegisterInput): Promise<{ user: IUser; token: string }> {
    const existing = await User.findOne({ phone: input.phone });
    if (existing) {
      throw Object.assign(new Error('Phone number already registered'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const userId = new Types.ObjectId();

    // 1. Create Business
    const business = await Business.create({
      name: `${input.name} Rice Traders`,
      nameTamil: `${input.name} அரிசி மண்டி`,
      phone: input.phone,
      address: 'Tamil Nadu',
      ownerId: userId,
    });

    // 2. Create User
    const user = await User.create({
      _id: userId,
      phone: input.phone,
      passwordHash,
      name: input.name,
      role: 'owner',
      language: input.language || 'en',
      businessId: business._id,
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Login with phone + password. Returns JWT.
   */
  async login(input: LoginInput): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ phone: input.phone }).select('+passwordHash');
    if (!user) {
      throw Object.assign(new Error('Invalid phone number or password'), { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw Object.assign(new Error('Invalid phone number or password'), { status: 401 });
    }

    // Ensure user has a business attached if previously unlinked
    if (!user.businessId) {
      let business = await Business.findOne({ ownerId: user._id });
      if (!business) {
        business = await Business.create({
          name: `${user.name} Rice Traders`,
          nameTamil: `${user.name} அரிசி மண்டி`,
          phone: user.phone,
          address: 'Tamil Nadu',
          ownerId: user._id,
        });
      }
      user.businessId = business._id as any;
      await user.save();
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Get user profile by ID.
   */
  async getProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-passwordHash');
  }

  /**
   * Generate JWT with user context.
   */
  private generateToken(user: IUser): string {
    const payload: JwtPayload = {
      userId: (user._id as any).toString(),
      phone: user.phone,
      role: user.role,
      businessId: user.businessId?.toString(),
    };

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }
}

export const authService = new AuthService();
