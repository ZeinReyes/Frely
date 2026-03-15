'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderKanban, Clock,
  FileText, ScrollText, Receipt, Bell, Settings, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/clients',       label: 'Clients',    icon: Users },
  { href: '/projects',      label: 'Projects',   icon: FolderKanban },
  { href: '/time-tracker',  label: 'Time',       icon: Clock },
  { href: '/proposals',     label: 'Proposals',  icon: FileText },
  { href: '/contracts',     label: 'Contracts',  icon: ScrollText },
  { href: '/invoices',      label: 'Invoices',   icon: Receipt },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <span className="text-xl font-bold text-primary tracking-tight">Vyrn</span>
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
                  ? 'bg-primary-50 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-gray-400')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 p-3 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-primary-50 text-primary'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <Settings className="h-4 w-4 shrink-0 text-gray-400" />
          Settings
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.plan}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
