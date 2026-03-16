'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, TrendingUp, Receipt, CreditCard,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const PLAN_COLORS: Record<string, string> = {
  STARTER: '#6b7280',
  SOLO:    '#3b82f6',
  PRO:     '#6C63FF',
  AGENCY:  '#8b5cf6',
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn:  async () => {
      const { data } = await api.get('/api/admin/stats');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const growth = data?.newUsersLastMonth > 0
    ? Math.round(((data.newUsersThisMonth - data.newUsersLastMonth) / data.newUsersLastMonth) * 100)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform overview and metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users',     value: data?.totalUsers || 0,         icon: Users,      format: (v: number) => v.toString(),      sub: `+${data?.newUsersThisMonth || 0} this month` },
          { label: 'New This Month',  value: data?.newUsersThisMonth || 0,  icon: TrendingUp, format: (v: number) => v.toString(),      sub: growth >= 0 ? `↑ ${growth}% vs last month` : `↓ ${Math.abs(growth)}% vs last month`, up: growth >= 0 },
          { label: 'Total Invoices',  value: data?.totalInvoices || 0,      icon: Receipt,    format: (v: number) => v.toString(),      sub: 'across all users' },
          { label: 'Platform Revenue',value: data?.totalRevenue || 0,       icon: CreditCard, format: (v: number) => formatCurrency(v), sub: 'from paid invoices' },
        ].map(({ label, value, icon: Icon, format, sub, up }) => (
          <div key={label} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{format(value as number)}</p>
            <p className={`text-xs mt-1 ${up === false ? 'text-red-400' : 'text-gray-500'}`}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Signup chart */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">New Signups (Last 30 days)</h2>
          {data?.signupChart && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.signupChart}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6C63FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6C63FF" strokeWidth={2} fill="url(#signupGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Plan Distribution</h2>
          {data?.planDistribution && (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={data.planDistribution}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={60}
                    paddingAngle={3}
                    dataKey="_count"
                  >
                    {data.planDistribution.map((entry: { plan: string }, i: number) => (
                      <Cell key={i} fill={PLAN_COLORS[entry.plan] || '#6b7280'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.planDistribution.map((entry: { plan: string; _count: number }) => (
                  <div key={entry.plan} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLAN_COLORS[entry.plan] || '#6b7280' }} />
                      <span className="text-gray-400">{entry.plan}</span>
                    </div>
                    <span className="font-semibold text-white">{entry._count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
