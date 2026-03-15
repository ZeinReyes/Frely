'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import {
  useNotifications, useUnreadCount, useNotificationStream,
  useMarkAsRead, useMarkAllAsRead, useDeleteNotification,
  type Notification,
} from '@/hooks/useNotifications';
import { formatDate } from '@/lib/utils';

// ─────────────────────────────────────────
// NOTIFICATION ICONS
// ─────────────────────────────────────────
const TYPE_ICONS: Record<string, string> = {
  MILESTONE_APPROVED: '✅',
  INVOICE_PAID:       '💰',
  CONTRACT_SIGNED:    '✍️',
  NEW_COMMENT:        '💬',
  INVOICE_OVERDUE:    '⚠️',
  PROPOSAL_ACCEPTED:  '🎉',
  PAYMENT_RECEIVED:   '💳',
};

const TYPE_LINKS: Record<string, (meta: Record<string, unknown>) => string> = {
  MILESTONE_APPROVED: (m) => `/projects/${m.projectId}`,
  INVOICE_PAID:       (m) => `/invoices/${m.invoiceId}`,
  CONTRACT_SIGNED:    (m) => `/contracts/${m.contractId}`,
  NEW_COMMENT:        (m) => `/projects/${m.projectId}`,
  INVOICE_OVERDUE:    (m) => `/invoices/${m.invoiceId}`,
};

function getLink(notification: Notification): string | null {
  const fn = TYPE_LINKS[notification.type];
  if (!fn || !notification.metadata) return null;
  try { return fn(notification.metadata); } catch { return null; }
}

// ─────────────────────────────────────────
// NOTIFICATION ITEM
// ─────────────────────────────────────────
function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onRead:       (id: string) => void;
  onDelete:     (id: string) => void;
  onNavigate:   (link: string) => void;
}) {
  const link = getLink(notification);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
        !notification.isRead ? 'bg-primary-50/40' : ''
      }`}
    >
      <div className="text-lg shrink-0 mt-0.5">
        {TYPE_ICONS[notification.type] || '🔔'}
      </div>
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => {
          if (!notification.isRead) onRead(notification.id);
          if (link) onNavigate(link);
        }}
      >
        <p className={`text-sm leading-snug ${notification.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.isRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
            title="Mark as read"
            className="p-1 text-gray-400 hover:text-primary rounded transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
          title="Delete"
          className="p-1 text-gray-400 hover:text-danger rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// NOTIFICATION BELL
// ─────────────────────────────────────────
export function NotificationBell() {
  const router    = useRouter();
  const [open, setOpen] = useState(false);
  const ref       = useRef<HTMLDivElement>(null);

  useNotificationStream();

  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount   = 0 }             = useUnreadCount();
  const markAsRead   = useMarkAsRead();
  const markAllRead  = useMarkAllAsRead();
  const deleteNotif  = useDeleteNotification();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-modal overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium text-primary">({unreadCount} new)</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  title="Mark all as read"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={(id) => markAsRead.mutate(id)}
                  onDelete={(id) => deleteNotif.mutate(id)}
                  onNavigate={(link) => { router.push(link); setOpen(false); }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <button
                onClick={() => { router.push('/notifications'); setOpen(false); }}
                className="text-xs text-primary hover:underline"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
