import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { env } from '../config/env';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  accessToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      const err: any = new Error('A user with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash
    });

    const accessToken = this.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      accessToken
    };
  }

  /**
   * Log in an existing user
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const accessToken = this.generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      accessToken
    };
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      const err: any = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  private generateToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );
  }
}

export const authService = new AuthService();
