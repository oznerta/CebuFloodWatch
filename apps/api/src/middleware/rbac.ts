import { Response, NextFunction } from 'express';
import { UserRole, ActionPermission, hasPermission } from '@cebufloodwatch/shared';
import { AuthenticatedRequest } from './auth.js';

/**
 * Guard that enforces required ActionPermission based on RBAC matrix.
 */
export function requirePermission(permission: ActionPermission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required for this operation.' },
      });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role '${req.user.role}' lacks permission '${permission}'.`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Guard that restricts actions to a specific role tier.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Action requires one of: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Guard that ensures a Barangay Focal person only modifies resources in their assigned barangay.
 */
export function enforceBarangayScope(getBarangayIdFromReq: (req: AuthenticatedRequest) => string | undefined) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
      return;
    }

    // City DRRMO Admin has global jurisdiction across all barangays
    if (req.user.role === 'admin') {
      return next();
    }

    const targetBarangayId = getBarangayIdFromReq(req);
    if (!targetBarangayId || targetBarangayId !== req.user.barangay_id) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TERRITORIAL_SCOPE_FORBIDDEN',
          message: 'Barangay Focal person can only manage operations in their assigned barangay.',
        },
      });
      return;
    }

    next();
  };
}
