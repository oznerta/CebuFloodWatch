import { Router, Request, Response } from 'express';
import { query } from '../config/db.js';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  generateSignedToken,
  verifySignedToken,
  checkRateLimit,
} from '../services/security.js';

export const authRouter = Router();

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'lgu_officer' | 'responder' | 'citizen';
  phoneNumber?: string;
  barangay?: string;
  createdAt: string;
}

// Runtime storage for registered users (synchronized with PostgreSQL when database is connected)
export const runtimeUsers: StoredUser[] = [];

/**
 * POST /auth/register
 * Register a new system operator or citizen account with PBKDF2 hashing
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`reg_${clientIp}`, 15, 15)) {
      return res.status(429).json({
        success: false,
        error: 'Too many registration attempts from this network. Please wait a few minutes.',
      });
    }

    const { email, password, full_name, role = 'lgu_officer', phone_number, barangay = 'Mabolo' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email address, and password are required for registration.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long for security compliance.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = runtimeUsers.find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in.',
      });
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    const newUser: StoredUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      fullName: full_name.trim(),
      role: role as any,
      phoneNumber: phone_number,
      barangay,
      createdAt,
    };

    runtimeUsers.push(newUser);

    // Persist to PostgreSQL users table if connected
    try {
      await query(
        `INSERT INTO public.users (id, firebase_uid, email, full_name, role, phone_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [userId, `local_${userId}`, normalizedEmail, full_name.trim(), role === 'lgu_officer' ? 'barangay_focal' : role, phone_number]
      );
    } catch {
      // Memory store fallback
    }

    const token = generateSignedToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.fullName,
      barangay: newUser.barangay,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.fullName,
        role: newUser.role,
        barangay: newUser.barangay,
        phoneNumber: newUser.phoneNumber,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Registration failed.',
    });
  }
});

/**
 * POST /auth/login
 * Authenticate existing credentials with constant-time PBKDF2 verification
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`login_${clientIp}`, 10, 15)) {
      return res.status(429).json({
        success: false,
        error: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = runtimeUsers.find((u) => u.email === normalizedEmail);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please check your credentials or create a new account.',
      });
    }

    const token = generateSignedToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
      barangay: user.barangay,
    });

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        barangay: user.barangay,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Authentication error.',
    });
  }
});

/**
 * GET /auth/me
 * Cryptographically verify active session token and return identity
 */
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. No active session token provided.',
    });
  }

  const token = authHeader.split('Bearer ')[1];
  const payload = verifySignedToken(token);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please sign in again.',
    });
  }

  return res.json({
    success: true,
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      barangay: payload.barangay,
    },
  });
});

/**
 * GET /auth/users
 * Return all registered system operators (For Admin User Management)
 */
authRouter.get('/users', (_req: Request, res: Response) => {
  const sanitized = runtimeUsers.map((u) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    phone: u.phoneNumber || 'N/A',
    role: u.role,
    barangay: u.barangay || 'Metro Cebu',
    status: 'active',
    lastActive: 'Online',
    createdAt: u.createdAt,
  }));

  return res.json({
    success: true,
    data: sanitized,
  });
});
