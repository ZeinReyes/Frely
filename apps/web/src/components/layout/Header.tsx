'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/clients':       'Clients',
  '/projects':      'Projects',
  '/time-tracker':  'Time Tracker',
  '/proposals':     'Proposals',
  '/contracts':     'Contracts',
  '/invoices':      'Invoices',
  '/notifications': 'Notifications',
  '/settings':      'Settings',
};

export function Header() {
  const pathname = usePathname();
  const { user }  = useAuth();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] || 'Vyrn';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      <div className="flex items-center gap-3">
        {/* Notifications bell */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <Bell className="h-5 w-5" />
          {/* Unread badge — wired in Module 11 */}
        </button>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      </div>
    </header>
  );
}
