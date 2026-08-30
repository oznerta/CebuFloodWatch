import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@cebufloodwatch/shared';
import { verifySignedToken } from '../services/security.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firebase_uid?: string;
    email: string;
    full_name: string;
    role: UserRole;
    barangay_id: string | null;
  };
}

/**
 * Production-Grade Authentication Middleware
 * Strictly validates HMAC-SHA256 signed JWT tokens on all protected disaster endpoints.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization Bearer header.' },
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Empty authentication token provided.' },
    });
    return;
  }

  const payload = verifySignedToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Cryptographic token signature verification failed or token has expired.' },
    });
    return;
  }

  // Set verified user claims
  req.user = {
    id: payload.userId,
    email: payload.email,
    full_name: payload.name,
    role: payload.role as UserRole,
    barangay_id: payload.barangay || null,
  };

  next();
}
