'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Users, FolderKanban, Receipt, TrendingUp, Loader2 } from 'lucide-react';

function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Only fetch endpoints that exist — invoices added in Module 9
      const [clientsRes, projectsRes] = await Promise.all([
        api.get('/api/clients?limit=1'),
        api.get('/api/projects?status=ACTIVE&limit=1'),
      ]);

      const totalClients   = clientsRes.data.pagination?.total   || 0;
      const activeProjects = projectsRes.data.pagination?.total  || 0;

      return {
        totalClients,
        activeProjects,
        pendingInvoices: 0, // wired in Module 9
        revenueMTD:      0, // wired in Module 9
      };
    },
  });
}

const STATS = [
  {
    key:    'totalClients',
    label:  'Total Clients',
    icon:   Users,
    color:  'bg-blue-50 text-blue-600',
    format: (v: number) => v.toString(),
  },
  {
    key:    'activeProjects',
    label:  'Active Projects',
    icon:   FolderKanban,
    color:  'bg-primary-50 text-primary',
    format: (v: number) => v.toString(),
  },
  {
    key:    'pendingInvoices',
    label:  'Pending Invoices',
    icon:   Receipt,
    color:  'bg-amber-50 text-amber-600',
    format: (v: number) => v.toString(),
  },
  {
    key:    'revenueMTD',
    label:  'Revenue (MTD)',
    icon:   TrendingUp,
    color:  'bg-green-50 text-green-600',
    format: (v: number) => formatCurrency(v),
  },
];

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => {
          const Icon  = stat.icon;
          const value = data ? data[stat.key as keyof typeof data] : 0;

          return (
            <div key={stat.key} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stat.format(value as number)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink
          title="Clients"
          href="/clients"
          description="View and manage your client relationships"
          icon={Users}
        />
        <QuickLink
          title="Projects"
          href="/projects"
          description="Check project progress and task boards"
          icon={FolderKanban}
        />
        <QuickLink
          title="Invoices"
          href="/invoices"
          description="Track payments and outstanding invoices"
          icon={Receipt}
        />
      </div>
    </div>
  );
}

function QuickLink({
  title,
  href,
  description,
  icon: Icon,
}: {
  title:       string;
  href:        string;
  description: string;
  icon:        React.ElementType;
}) {
  return (
    <a
      href={href}
      className="card p-5 hover:shadow-md transition-shadow group cursor-pointer block"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </a>
  );
}