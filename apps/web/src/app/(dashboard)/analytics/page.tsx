'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, DollarSign, Clock, Users,
  FolderKanban, Receipt, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type Period = 'month' | 'year' | 'all';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
interface AnalyticsData {
  summary: {
    totalEarned:     number;
    totalPending:    number;
    totalOverdue:    number;
    thisMonthPaid:   number;
    thisYearPaid:    number;
    avgInvoiceValue: number;
    onTimeRate:      number;
    totalHours:      number;
    totalClients:    number;
    totalProjects:   number;
    activeProjects:  number;
    totalInvoices:   number;
  };
  revenueChart:            { month: string; revenue: number }[];
  invoiceStatusBreakdown:  { status: string; count: number; color: string }[];
  topClients:              { name: string; revenue: number; invoices: number }[];
  projectStatusBreakdown:  { status: string; count: number; color: string }[];
  hoursChart:              { name: string; hours: number }[];
  clientGrowth:            { month: string; count: number }[];
}

// ─────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────
function StatCard({
  title, value, subtitle, icon: Icon, color = 'primary',
}: {
  title:    string;
  value:    string;
  subtitle?: string;
  icon:     React.ElementType;
  color?:   'primary' | 'green' | 'red' | 'amber';
}) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary',
    green:   'bg-green-50 text-green-600',
    red:     'bg-red-50 text-red-600',
    amber:   'bg-amber-50 text-amber-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-primary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// ANALYTICS PAGE
// ─────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('year');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn:  async () => {
      const { data } = await api.get(`/api/analytics?period=${period}`);
      return data.data as AnalyticsData;
    },
  });

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your business performance</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['month', 'year', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'all' ? 'All time' : `This ${p}`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Earned"
          value={formatCurrency(summary.totalEarned)}
          subtitle={`${formatCurrency(summary.thisMonthPaid)} this month`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(summary.totalPending)}
          subtitle={`${summary.totalInvoices - (data.invoiceStatusBreakdown.find(s => s.status === 'Paid')?.count || 0)} unpaid invoices`}
          icon={Receipt}
          color="primary"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(summary.totalOverdue)}
          subtitle="Needs attention"
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="On-time Rate"
          value={`${summary.onTimeRate}%`}
          subtitle="Clients paying on time"
          icon={CheckCircle2}
          color="green"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Hours"
          value={`${summary.totalHours}h`}
          subtitle="Time tracked"
          icon={Clock}
        />
        <StatCard
          title="Avg Invoice"
          value={formatCurrency(summary.avgInvoiceValue)}
          subtitle="Per invoice"
          icon={TrendingUp}
        />
        <StatCard
          title="Clients"
          value={String(summary.totalClients)}
          subtitle="Total clients"
          icon={Users}
        />
        <StatCard
          title="Projects"
          value={String(summary.totalProjects)}
          subtitle={`${summary.activeProjects} active`}
          icon={FolderKanban}
        />
      </div>

      {/* Revenue chart */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue Over Time</h2>
        {data.revenueChart.every(d => d.revenue === 0) ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No revenue data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6C63FF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6C63FF"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Invoice status */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Invoice Status</h2>
          {data.invoiceStatusBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No invoices yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={data.invoiceStatusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {data.invoiceStatusBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.invoiceStatusBreakdown.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-600">{entry.status}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-auto">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project status */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Project Status</h2>
          {data.projectStatusBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No projects yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={data.projectStatusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {data.projectStatusBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.projectStatusBreakdown.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-600">{entry.status}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-auto">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Clients by Revenue</h2>
          {data.topClients.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No paid invoices yet</div>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((client, i) => {
                const max = data.topClients[0].revenue;
                const pct = max > 0 ? (client.revenue / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 truncate">{client.name}</span>
                      <span className="text-gray-500 ml-2 shrink-0">
                        {formatCurrency(client.revenue)} · {client.invoices} inv
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hours per project */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Hours per Project</h2>
          {data.hoursChart.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No time entries yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.hoursChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + '…' : v}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v}h`, 'Hours']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="hours" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
