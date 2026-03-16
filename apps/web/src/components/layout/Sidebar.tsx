'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderKanban, Clock,
  FileText, ScrollText, Receipt, Bell, Settings, LogOut, BarChart2, Zap, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { TimerWidget } from '@/components/ui/TimerWidget';

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/clients',       label: 'Clients',      icon: Users },
  { href: '/projects',      label: 'Projects',     icon: FolderKanban },
  { href: '/time-tracker',  label: 'Time',         icon: Clock },
  { href: '/proposals',     label: 'Proposals',    icon: FileText },
  { href: '/contracts',     label: 'Contracts',    icon: ScrollText },
  { href: '/invoices',      label: 'Invoices',     icon: Receipt },
  { href: '/analytics',     label: 'Analytics',    icon: BarChart2 },
  { href: '/notifications', label: 'Notifications',icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className="w-56 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xl font-bold text-primary tracking-tight">Frely</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 dark:bg-primary/10 text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-gray-400 dark:text-gray-500')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Timer widget */}
      <TimerWidget />

      {/* Bottom section */}
      <div ref={menuRef} className="relative border-t border-gray-200 dark:border-gray-800">

        {/* Popover menu */}
        <div
          className={cn(
            'absolute bottom-full left-0 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-lg shadow-lg dark:shadow-black/40 overflow-hidden transition-all duration-200',
            menuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-2 pointer-events-none'
          )}
        >
          <div className="p-2 space-y-0.5">

            {/* Upgrade Plan */}
            <Link
              href="/upgrade"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700"
            >
              <Zap className="h-4 w-4 shrink-0 text-amber-400" />
              Upgrade Plan
              <span className="ml-auto text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-1.5 py-0.5 rounded">
                Pro
              </span>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith('/settings')
                  ? 'bg-primary-50 dark:bg-primary/10 text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <Settings className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
              Settings
            </Link>

            {/* Sign out */}
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>

          </div>
        </div>

        {/* User row */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.plan ?? 'Starter'}</p>
          </div>
          <ChevronUp
            className={cn(
              'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
              menuOpen ? 'rotate-180' : 'rotate-0'
            )}
          />
        </button>

      </div>
    </aside>
  );
}