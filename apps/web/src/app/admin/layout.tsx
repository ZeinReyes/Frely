'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, FileText, CreditCard,
  Zap, LogOut, ChevronRight, Shield,
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin',          label: 'Dashboard',       icon: LayoutDashboard, exact: true },
  { href: '/admin/users',    label: 'Users',           icon: Users },
  { href: '/admin/plans',    label: 'Plans',           icon: CreditCard },
  { href: '/admin/landing',  label: 'Landing Page',    icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get('/api/settings/profile')
      .then(({ data }) => {
        if (data.data.profile.role !== 'ADMIN') {
          router.replace('/dashboard');
        } else {
          setChecking(false);
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-gray-800 gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">Frely</span>
            <div className="flex items-center gap-1">
              <Shield className="h-2.5 w-2.5 text-primary" />
              <span className="text-[10px] text-primary font-semibold">ADMIN</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-gray-500')} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" /> Back to app
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
