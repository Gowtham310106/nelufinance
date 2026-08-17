// src/features/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/user.model';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.validators';
import { JwtPayload } from '../../middleware/auth.middleware';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

export class AuthService {
  /**
   * Register a new user. Throws if phone already exists.
   * Note: businessId is set later during onboarding.
   */
  async register(input: RegisterInput): Promise<{ user: IUser; token: string }> {
    const existing = await User.findOne({ phone: input.phone });
    if (existing) {
      throw Object.assign(new Error('Phone number already registered'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await User.create({
      phone: input.phone,
      passwordHash,
      name: input.name,
      role: 'owner', // First user is always an owner
      language: input.language || 'en',
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
