import prisma from '../config/database';
import { AppError } from '../utils/AppError';

// ─────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────
export async function getAdminStats() {
  const now            = new Date();
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers, newUsersThisMonth, newUsersLastMonth,
    planCounts, totalInvoices, paidInvoices,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    prisma.user.groupBy({ by: ['plan'], _count: { _all: true } }),
    prisma.invoice.count(),
    prisma.invoice.findMany({ where: { status: 'PAID' }, select: { total: true } }),
  ]);

  const totalRevenue = paidInvoices.reduce((s, i) => s + Number(i.total), 0);

  // New signups per day (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentUsers = await prisma.user.findMany({
    where:  { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const signupsByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    signupsByDay[key] = 0;
  }
  for (const user of recentUsers) {
    const key = user.createdAt.toISOString().split('T')[0];
    if (key in signupsByDay) signupsByDay[key]++;
  }

  const signupChart = Object.entries(signupsByDay).map(([date, count]) => ({ date, count }));

  return {
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    planDistribution: planCounts.map(p => ({ plan: p.plan, _count: p._count._all })),
    totalInvoices,
    totalRevenue: Math.round(totalRevenue),
    signupChart,
  };
}

// ─────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────
export async function listUsers(page = 1, limit = 20, search?: string) {
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { name:  { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:           true,
        name:         true,
        email:        true,
        plan:         true,
        role:         true,
        createdAt:    true,
        _count: {
          select: {
            clients:  true,
            projects: true,
            invoices: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function updateUserPlan(userId: string, plan: string) {
  const validPlans = ['STARTER', 'SOLO', 'PRO', 'AGENCY'];
  if (!validPlans.includes(plan)) throw AppError.badRequest('Invalid plan');

  return prisma.user.update({
    where: { id: userId },
    data:  { plan: plan as never },
    select: { id: true, name: true, email: true, plan: true },
  });
}

export async function updateUserRole(userId: string, role: string) {
  const validRoles = ['USER', 'ADMIN'];
  if (!validRoles.includes(role)) throw AppError.badRequest('Invalid role');

  return prisma.user.update({
    where: { id: userId },
    data:  { role },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function deleteUser(userId: string) {
  // Cascade delete is handled by Prisma relations
  await prisma.user.delete({ where: { id: userId } });
}

// ─────────────────────────────────────────
// LANDING CONTENT
// ─────────────────────────────────────────
export async function getLandingContent() {
  const content = await prisma.landingContent.findMany({
    orderBy: { key: 'asc' },
  });
  // Convert to key-value map
  return content.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, unknown>);
}

export async function updateLandingContent(key: string, value: unknown) {
  return prisma.landingContent.upsert({
    where:  { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
}

// ─────────────────────────────────────────
// PLAN CONFIG
// ─────────────────────────────────────────
export async function getPlans() {
  return prisma.planConfig.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

export async function updatePlan(id: string, input: {
  displayName?: string;
  description?: string;
  price?:       number;
  period?:      string;
  isPopular?:   boolean;
  isVisible?:   boolean;
  features?:    string[];
  limits?:      { clients: number; projects: number; invoices: number };
  sortOrder?:   number;
}) {
  const plan = await prisma.planConfig.findUnique({ where: { id } });
  if (!plan) throw AppError.notFound('Plan not found');

  return prisma.planConfig.update({
    where: { id },
    data:  input as never,
  });
}