/**
 * Role-based authorization middleware
 * Must run AFTER verifyToken middleware (requires req.user to be set)
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './verifyToken';

/**
 * Factory function that returns middleware checking if req.user.role
 * is one of the allowed roles.
 * Returns 403 if role mismatch.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }

    next();
  };
}
