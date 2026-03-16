import { type Request, type Response, type NextFunction } from 'express';
import { getAnalytics } from '../services/analyticsService';
import { sendSuccess } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function analytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user }   = req as AuthenticatedRequest;
    const period     = (req.query.period as 'month' | 'year' | 'all') || 'year';
    const data       = await getAnalytics(user.id, period);
    sendSuccess(res, data);
  } catch (error) { next(error); }
}
