import { type Request, type Response, type NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type { AuthenticatedRequest } from '../types';

const PLAN_LIMITS = {
  STARTER: { clients: 3, projects: 3, aiRequests: 10, storage: 1 },
  SOLO:    { clients: Infinity, projects: Infinity, aiRequests: 100, storage: 10 },
  PRO:     { clients: Infinity, projects: Infinity, aiRequests: 500, storage: 50 },
  AGENCY:  { clients: Infinity, projects: Infinity, aiRequests: Infinity, storage: 200 },
};

export function checkClientLimit() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const plan = (user.plan as keyof typeof PLAN_LIMITS) || 'STARTER';
      const limit = PLAN_LIMITS[plan].clients;

      if (limit === Infinity) return next();

      const count = await prisma.client.count({ where: { userId: user.id } });

      if (count >= limit) {
        throw AppError.paymentRequired(
          `Your ${plan} plan allows a maximum of ${limit} clients. Upgrade to add more.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function checkProjectLimit() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const plan = (user.plan as keyof typeof PLAN_LIMITS) || 'STARTER';
      const limit = PLAN_LIMITS[plan].projects;

      if (limit === Infinity) return next();

      const count = await prisma.project.count({ where: { userId: user.id } });

      if (count >= limit) {
        throw AppError.paymentRequired(
          `Your ${plan} plan allows a maximum of ${limit} projects. Upgrade to add more.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export { PLAN_LIMITS };
