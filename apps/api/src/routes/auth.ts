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
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'lgu_officer' | 'barangay_focal' | 'responder' | 'citizen';
  phoneNumber?: string;
  barangay?: string;
  createdAt: string;
}

// Runtime storage for registered users
export const runtimeUsers: StoredUser[] = [];

// Seed the Primary Master Administrator Account
const DEFAULT_ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_INITIAL_EMAIL || 'admin@cebucity.gov.ph';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';

const seedMasterAdmin = async () => {
  const existing = runtimeUsers.find((u) => u.email === DEFAULT_ADMIN_EMAIL);
  if (!existing) {
    const adminUser: StoredUser = {
      id: DEFAULT_ADMIN_ID,
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
      fullName: 'CDRRMO Master Administrator',
      role: 'admin',
      phoneNumber: '',
      barangay: 'Global (Citywide Jurisdiction)',
      createdAt: new Date().toISOString(),
    };
    runtimeUsers.push(adminUser);
    console.log(`👑 [Security] Master Administrator initialized: ${DEFAULT_ADMIN_EMAIL}`);

    // Synchronize with Supabase PostgreSQL if table exists
    try {
      await query(
        `INSERT INTO public.users (id, firebase_uid, email, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, 'admin', TRUE)
         ON CONFLICT (email) DO UPDATE SET role = 'admin';`,
        [DEFAULT_ADMIN_ID, `sec_${DEFAULT_ADMIN_ID}`, DEFAULT_ADMIN_EMAIL, 'CDRRMO Master Administrator']
      );
    } catch {}
  }
};

seedMasterAdmin();

/**
 * POST /auth/login
 * Official Command Center Sign In
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`login_${clientIp}`, 20, 15)) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please wait a few minutes before trying again.',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Both email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = runtimeUsers.find((u) => u.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Account not found. Command Center accounts must be provisioned by a System Administrator.',
      });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please verify your credentials or contact your Administrator.',
      });
    }

    const token = generateSignedToken({
      id: user.id,
      email: user.email,
      role: user.role,
      barangay: user.barangay,
    });

    return res.json({
      success: true,
      message: 'Sign in successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        barangay: user.barangay,
      },
      token,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Authentication failed: ${error.message || 'Internal server error'}`,
    });
  }
});

/**
 * POST /auth/register (Citizen Mobile Registration Only)
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role = 'citizen', phone_number, barangay = 'Mabolo' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email address, and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
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

    // Save citizen to PostGIS
    try {
      await query(
        `INSERT INTO public.users (id, firebase_uid, email, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, 'citizen', TRUE)
         ON CONFLICT (email) DO NOTHING;`,
        [userId, `sec_${userId}`, normalizedEmail, full_name.trim()]
      );
    } catch {}

    const token = generateSignedToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      barangay: newUser.barangay,
    });

    return res.status(201).json({
      success: true,
      message: 'Citizen account created successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.fullName,
        role: newUser.role,
        barangay: newUser.barangay,
      },
      token,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /auth/me
 */
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifySignedToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
  }

  const user = runtimeUsers.find((u) => u.id === payload.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found.' });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      barangay: user.barangay,
    },
  });
});

/**
 * GET /auth/users (Admin Only: List all operator accounts)
 */
authRouter.get('/users', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Restricted to Administrator clearance tier.' });
  }

  return res.json({
    success: true,
    data: runtimeUsers.map((u) => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
      role: u.role,
      barangay: u.barangay || 'Citywide',
      phone: u.phoneNumber || 'N/A',
      status: 'active',
      lastActive: u.createdAt,
    })),
  });
});

/**
 * POST /auth/users (Admin Only: Provision new operator account)
 */
authRouter.post('/users', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Restricted to Administrator clearance tier.' });
  }

  const { email, password, fullName, role, barangay, phoneNumber } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ success: false, error: 'Email, temporary password, full name, and clearance role are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (runtimeUsers.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ success: false, error: 'An operator with this email address already exists.' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();

  const newOperator: StoredUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    fullName: fullName.trim(),
    role,
    barangay: role === 'admin' ? 'Global (Citywide Jurisdiction)' : barangay || 'Mabolo',
    phoneNumber,
    createdAt,
  };

  runtimeUsers.push(newOperator);

  // Save operator to PostGIS
  try {
    await query(
      `INSERT INTO public.users (id, firebase_uid, email, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;`,
      [userId, `sec_${userId}`, normalizedEmail, fullName.trim(), role]
    );
  } catch {}

  return res.status(201).json({
    success: true,
    message: `Account for ${newOperator.fullName} (${newOperator.role.toUpperCase()}) successfully provisioned.`,
    user: {
      id: newOperator.id,
      name: newOperator.fullName,
      email: newOperator.email,
      role: newOperator.role,
      barangay: newOperator.barangay,
    },
  });
});

/**
 * DELETE /auth/users/:id (Admin Only: Revoke operator clearance)
 */
authRouter.delete('/users/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Restricted to Administrator clearance tier.' });
  }

  const targetId = req.params.id;
  if (targetId === DEFAULT_ADMIN_ID || targetId === req.user?.id) {
    return res.status(400).json({ success: false, error: 'Cannot delete the active or master administrator account.' });
  }

  const index = runtimeUsers.findIndex((u) => u.id === targetId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Operator account not found.' });
  }

  const deleted = runtimeUsers.splice(index, 1)[0];

  try {
    await query(`DELETE FROM public.users WHERE id = $1`, [targetId]);
  } catch {}

  return res.json({
    success: true,
    message: `Clearance for operator '${deleted.fullName}' successfully revoked.`,
  });
});
