import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@cebufloodwatch/shared';
import { query } from '../config/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firebase_uid: string;
    email: string;
    full_name: string;
    role: UserRole;
    barangay_id: string | null;
  };
}

/**
 * Authentication Middleware
 * Validates Authorization Bearer token or provides dev-mock user for local development.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  // Development bypass / mock header support
  if (process.env.NODE_ENV === 'development' && (!authHeader || authHeader.startsWith('Bearer mock_'))) {
    const mockRole = (req.headers['x-mock-role'] as UserRole) || 'admin';
    const mockBarangay = (req.headers['x-mock-barangay'] as string) || null;

    req.user = {
      id: 'u0000000-0000-0000-0000-000000000001',
      firebase_uid: 'mock_firebase_uid',
      email: 'mock.admin@cebu.gov.ph',
      full_name: 'Mock Test User',
      role: mockRole,
      barangay_id: mockBarangay,
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header.' },
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // In production with Firebase Admin configured:
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // For initial scaffolding, query users table by token/uid
    const userRes = await query(
      'SELECT id, firebase_uid, email, full_name, role, barangay_id FROM public.users WHERE firebase_uid = $1 OR email = $1 LIMIT 1',
      [token]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'User not registered in disaster response directory.' },
      });
      return;
    }

    req.user = userRes.rows[0];
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Token verification failed.', details: err.message },
    });
  }
}
