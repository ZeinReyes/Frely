import prisma from '../config/database';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────
// MAIN ANALYTICS
// ─────────────────────────────────────────
export async function getAnalytics(userId: string, period: 'month' | 'year' | 'all' = 'year') {
  const now   = new Date();
  const since = period === 'month'
    ? startOfMonth(now)
    : period === 'year'
    ? startOfYear(now)
    : new Date(0);

  // Fetch all data in parallel
  const [invoices, projects, clients, timeEntries] = await Promise.all([
    prisma.invoice.findMany({
      where:   { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id:           true,
        total:        true,
        status:       true,
        currency:     true,
        dueDate:      true,
        paidAt:       true,
        createdAt:    true,
        clientId:     true,
        client:       { select: { id: true, name: true } },
      },
    }),
    prisma.project.findMany({
      where:  { userId },
      select: { id: true, name: true, status: true, clientId: true, createdAt: true },
    }),
    prisma.client.findMany({
      where:  { userId },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.timeEntry.findMany({
      where:  { userId, endTime: { not: null } },
      select: {
        id:        true,
        duration:  true,
        startTime: true,
        projectId: true,
        project:   { select: { id: true, name: true } },
      },
    }),
  ]);

  // ── Summary Stats ──────────────────────
  const paidInvoices    = invoices.filter(i => i.status === 'PAID');
  const pendingInvoices = invoices.filter(i => ['SENT', 'VIEWED'].includes(i.status));
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');

  const totalEarned     = paidInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPending    = pendingInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalOverdue    = overdueInvoices.reduce((s, i) => s + Number(i.total), 0);

  const thisMonthPaid   = paidInvoices
    .filter(i => i.paidAt && new Date(i.paidAt) >= startOfMonth(now))
    .reduce((s, i) => s + Number(i.total), 0);

  const thisYearPaid    = paidInvoices
    .filter(i => i.paidAt && new Date(i.paidAt) >= startOfYear(now))
    .reduce((s, i) => s + Number(i.total), 0);

  const avgInvoiceValue = paidInvoices.length > 0
    ? totalEarned / paidInvoices.length
    : 0;

  const onTimeCount = paidInvoices.filter(i =>
    i.dueDate && i.paidAt && new Date(i.paidAt) <= new Date(i.dueDate)
  ).length;
  const onTimeRate = paidInvoices.length > 0
    ? Math.round((onTimeCount / paidInvoices.length) * 100)
    : 0;

  const totalHours = timeEntries.reduce((s, e) => s + (e.duration || 0), 0) / 3600;

  // ── Revenue Over Time (last 12 months) ─
  const revenueByMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthLabel(d);
    revenueByMonth[label] = 0;
  }
  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue;
    const label = monthLabel(new Date(inv.paidAt));
    if (label in revenueByMonth) {
      revenueByMonth[label] += Number(inv.total);
    }
  }
  const revenueChart = Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month, revenue: Math.round(revenue),
  }));

  // ── Invoice Status Breakdown ───────────
  const invoiceStatusBreakdown = [
    { status: 'Paid',     count: paidInvoices.length,    color: '#10B981' },
    { status: 'Pending',  count: pendingInvoices.length, color: '#6C63FF' },
    { status: 'Overdue',  count: overdueInvoices.length, color: '#EF4444' },
    { status: 'Draft',    count: invoices.filter(i => i.status === 'DRAFT').length, color: '#9ca3af' },
  ].filter(s => s.count > 0);

  // ── Top Clients by Revenue ─────────────
  const clientRevenue: Record<string, { name: string; revenue: number; invoices: number }> = {};
  for (const inv of paidInvoices) {
    if (!clientRevenue[inv.clientId]) {
      clientRevenue[inv.clientId] = { name: inv.client.name, revenue: 0, invoices: 0 };
    }
    clientRevenue[inv.clientId].revenue  += Number(inv.total);
    clientRevenue[inv.clientId].invoices += 1;
  }
  const topClients = Object.values(clientRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(c => ({ ...c, revenue: Math.round(c.revenue) }));

  // ── Project Status Overview ────────────
  const projectStatusBreakdown = [
    { status: 'Active',    count: projects.filter(p => p.status === 'ACTIVE').length,    color: '#6C63FF' },
    { status: 'Completed', count: projects.filter(p => p.status === 'COMPLETED').length, color: '#10B981' },
    { status: 'On Hold',   count: projects.filter(p => p.status === 'ON_HOLD').length,   color: '#F59E0B' },
    { status: 'Cancelled', count: projects.filter(p => p.status === 'CANCELLED').length, color: '#EF4444' },
  ].filter(s => s.count > 0);

  // ── Hours Per Project (top 6) ──────────
  const hoursByProject: Record<string, { name: string; hours: number }> = {};
  for (const entry of timeEntries) {
    if (!hoursByProject[entry.projectId]) {
      hoursByProject[entry.projectId] = { name: entry.project.name, hours: 0 };
    }
    hoursByProject[entry.projectId].hours += (entry.duration || 0) / 3600;
  }
  const hoursChart = Object.values(hoursByProject)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6)
    .map(p => ({ ...p, hours: Math.round(p.hours * 10) / 10 }));

  // ── New Clients Per Month (last 6) ─────
  const clientsByMonth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    clientsByMonth[monthLabel(d)] = 0;
  }
  for (const client of clients) {
    const label = monthLabel(new Date(client.createdAt));
    if (label in clientsByMonth) clientsByMonth[label]++;
  }
  const clientGrowth = Object.entries(clientsByMonth).map(([month, count]) => ({ month, count }));

  return {
    summary: {
      totalEarned:    Math.round(totalEarned),
      totalPending:   Math.round(totalPending),
      totalOverdue:   Math.round(totalOverdue),
      thisMonthPaid:  Math.round(thisMonthPaid),
      thisYearPaid:   Math.round(thisYearPaid),
      avgInvoiceValue: Math.round(avgInvoiceValue),
      onTimeRate,
      totalHours:     Math.round(totalHours * 10) / 10,
      totalClients:   clients.length,
      totalProjects:  projects.length,
      activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
      totalInvoices:  invoices.length,
    },
    revenueChart,
    invoiceStatusBreakdown,
    topClients,
    projectStatusBreakdown,
    hoursChart,
    clientGrowth,
  };
}
