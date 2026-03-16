'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Users, FolderKanban, Receipt, TrendingUp,
  Loader2, ArrowRight, AlertCircle,
} from 'lucide-react';

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [clientsRes, projectsRes, analyticsRes] = await Promise.all([
        api.get('/api/clients?limit=1'),
        api.get('/api/projects?status=ACTIVE&limit=1'),
        api.get('/api/analytics?period=month'),
      ]);

      const totalClients   = clientsRes.data.pagination?.total  || 0;
      const activeProjects = projectsRes.data.pagination?.total || 0;
      const analytics      = analyticsRes.data.data;

      return {
        totalClients,
        activeProjects,
        pendingInvoices: analytics.summary.totalPending  || 0,
        overdueInvoices: analytics.summary.totalOverdue  || 0,
        revenueMTD:      analytics.summary.thisMonthPaid || 0,
        topClients:      analytics.topClients            || [],
      };
    },
  });
}

export default function DashboardPage() {
  const router              = useRouter();
  const { data, isLoading } = useDashboardStats();

  const stats = [
    { key: 'totalClients',   label: 'Total Clients',        icon: Users,       color: 'bg-blue-50 text-blue-600',    format: (v: number) => v.toString(),      href: '/clients' },
    { key: 'activeProjects', label: 'Active Projects',      icon: FolderKanban, color: 'bg-primary-50 text-primary', format: (v: number) => v.toString(),      href: '/projects' },
    { key: 'revenueMTD',     label: 'Revenue (This Month)', icon: TrendingUp,  color: 'bg-green-50 text-green-600',  format: (v: number) => formatCurrency(v), href: '/analytics' },
    { key: 'pendingInvoices',label: 'Pending Invoices',     icon: Receipt,     color: 'bg-amber-50 text-amber-600',  format: (v: number) => formatCurrency(v), href: '/invoices' },
  ];

  return (
    <div className="page-container">
      <div className="page-header mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon  = stat.icon;
          const value = data ? data[stat.key as keyof typeof data] as number : 0;
          return (
            <div
              key={stat.key}
              onClick={() => router.push(stat.href)}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {stat.format(value)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Overdue alert */}
      {!isLoading && data && data.overdueInvoices > 0 && (
        <div
          onClick={() => router.push('/invoices')}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6 cursor-pointer hover:bg-red-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm text-red-800 flex-1">
            You have <strong>{formatCurrency(data.overdueInvoices)}</strong> in overdue invoices that need attention.
          </p>
          <ArrowRight className="h-4 w-4 text-danger" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Top Clients by Revenue</h2>
            <button onClick={() => router.push('/clients')} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 text-gray-300 animate-spin" /></div>
          ) : !data?.topClients.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No paid invoices yet</p>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((client: { name: string; revenue: number }, i: number) => {
                const max = data.topClients[0]?.revenue || 1;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 truncate">{client.name}</span>
                      <span className="text-gray-500 ml-2 shrink-0">{formatCurrency(client.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(client.revenue / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Create new proposal', href: '/proposals/new', desc: 'Draft and send a proposal' },
              { label: 'Create new invoice',  href: '/invoices/new',  desc: 'Bill a client for completed work' },
              { label: 'Start time tracker',  href: '/time-tracker',  desc: 'Log hours on a project' },
              { label: 'View analytics',      href: '/analytics',     desc: 'See revenue and performance' },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-colors group text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{link.label}</p>
                  <p className="text-xs text-gray-500">{link.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}