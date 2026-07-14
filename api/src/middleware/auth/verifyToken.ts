/**
 * JWT verification middleware
 * Reads JWT from httpOnly cookie, verifies signature and expiration,
 * and attaches decoded user info to req.user
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/** Payload stored inside the JWT */
export interface JwtPayload {
  email: string;
  role: 'admin' | 'manager' | 'user';
}

/** Extends Express Request to include authenticated user */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware that verifies the JWT token from the `token` cookie.
 * Responds with 401 if token is missing, invalid, or expired.
 */
export function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: { code: 'TOKEN_EXPIRED', message: 'Session expired' },
      });
      return;
    }
    res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' },
    });
  }
}

export { JWT_SECRET };
