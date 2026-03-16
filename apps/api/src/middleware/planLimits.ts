import { type Request, type Response, type NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type { AuthenticatedRequest } from '../types';

const PLAN_LIMITS = {
  STARTER: { clients: 3,  projects: 3,  invoices: 5  },
  SOLO:    { clients: 15, projects: 15, invoices: 30 },
  PRO:     { clients: -1, projects: -1, invoices: -1 },
  AGENCY:  { clients: -1, projects: -1, invoices: -1 },
};

type LimitKey = 'clients' | 'projects' | 'invoices';

async function checkLimit(userId: string, plan: string, resource: LimitKey): Promise<void> {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.STARTER;
  const limit  = limits[resource];

  if (limit === -1) return;

  let count = 0;

  if (resource === 'clients') {
    count = await prisma.client.count({ where: { userId } });
  } else if (resource === 'projects') {
    count = await prisma.project.count({ where: { userId } });
  } else if (resource === 'invoices') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    count = await prisma.invoice.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });
  }

  if (count >= limit) {
    const planName = plan.charAt(0) + plan.slice(1).toLowerCase();
    throw AppError.forbidden(
      `You've reached the ${resource} limit for the ${planName} plan (${limit} max). Upgrade your plan to add more.`
    );
  }
}

export function limitClients() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthenticatedRequest;
      await checkLimit(user.id, user.plan, 'clients');
      next();
    } catch (error) { next(error); }
  };
}

export function limitProjects() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthenticatedRequest;
      await checkLimit(user.id, user.plan, 'projects');
      next();
    } catch (error) { next(error); }
  };
}

export function limitInvoices() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthenticatedRequest;
      await checkLimit(user.id, user.plan, 'invoices');
      next();
    } catch (error) { next(error); }
  };
}
