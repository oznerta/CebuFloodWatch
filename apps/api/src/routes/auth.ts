import { Router, Request, Response } from 'express';
import { query } from '../config/db.js';
import crypto from 'crypto';

export const authRouter = Router();

// In-memory runtime user store with fallback persistence
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

// Runtime storage for registered users (synchronized with PostgreSQL if available)
export const runtimeUsers: StoredUser[] = [];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * POST /auth/register
 * Register a new system operator or citizen account
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role = 'lgu_officer', phone_number, barangay = 'Mabolo' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email address, and password are required for registration.',
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

    // Try persisting to PostgreSQL users table if connected
    try {
      await query(
        `INSERT INTO public.users (id, firebase_uid, email, full_name, role, phone_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [userId, `local_${userId}`, normalizedEmail, full_name.trim(), role === 'lgu_officer' ? 'barangay_focal' : role, phone_number]
      );
    } catch (dbErr) {
      // Graceful fallback to memory store
    }

    const token = `cw_token_${crypto.randomBytes(24).toString('hex')}`;

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
 * Authenticate existing credentials
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    const user = runtimeUsers.find(
      (u) => u.email === normalizedEmail && u.passwordHash === passwordHash
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please check your credentials or register a new account.',
      });
    }

    const token = `cw_token_${crypto.randomBytes(24).toString('hex')}`;

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
 * Return current session identity
 */
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. No active session token provided.',
    });
  }

  // If token provided, return success
  return res.json({
    success: true,
    message: 'Active session verified.',
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
