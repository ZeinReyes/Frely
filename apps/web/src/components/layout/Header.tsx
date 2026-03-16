'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { getTheme, setTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/clients':       'Clients',
  '/projects':      'Projects',
  '/time-tracker':  'Time Tracker',
  '/proposals':     'Proposals',
  '/contracts':     'Contracts',
  '/invoices':      'Invoices',
  '/analytics':     'Analytics',
  '/notifications': 'Notifications',
  '/settings':      'Settings',
};

export function Header() {
  const pathname = usePathname();
  const { user }  = useAuth();

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] || 'Frely';

  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(getTheme() === 'dark');
  }, []);

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setTheme(next);
    setDark(!dark);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          onClick={toggle}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary/20 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      </div>
    </header>
  );
}