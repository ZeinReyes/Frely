import { type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import type { AuthenticatedRequest } from '../types';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const { user } = req as AuthenticatedRequest;

  if (!user) {
    throw AppError.unauthorized('Authentication required');
  }

  if (user.role !== 'ADMIN') {
    throw AppError.forbidden('Admin access required');
  }

  next();
}
