import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats — populated in Module 13 (Analytics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Clients',   value: '—' },
          { label: 'Active Projects',  value: '—' },
          { label: 'Pending Invoices', value: '—' },
          { label: 'Revenue (MTD)',    value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-8 text-center text-gray-400">
        <p className="text-sm">
          Dashboard analytics will populate as you add clients, projects and invoices.
        </p>
      </div>
    </div>
  );
}
