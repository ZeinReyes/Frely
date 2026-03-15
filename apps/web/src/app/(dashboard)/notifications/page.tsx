'use client';

import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2, Check } from 'lucide-react';
import {
  useNotifications, useMarkAsRead, useMarkAllAsRead,
  useDeleteNotification, useNotificationStream,
  type Notification,
} from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

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

function getLink(n: Notification): string | null {
  const fn = TYPE_LINKS[n.type];
  if (!fn || !n.metadata) return null;
  try { return fn(n.metadata); } catch { return null; }
}

export default function NotificationsPage() {
  const router = useRouter();

  useNotificationStream();

  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead  = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  const unread = notifications.filter(n => !n.isRead).length;

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    const link = getLink(n);
    if (link) router.push(link);
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unread > 0 && (
            <p className="page-subtitle">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">All caught up!</h3>
          <p className="text-sm text-gray-500">No notifications yet. They'll appear here when something happens.</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-gray-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group cursor-pointer ${
                !n.isRead ? 'bg-primary-50/40' : ''
              }`}
              onClick={() => handleClick(n)}
            >
              <div className="text-xl shrink-0 mt-0.5">
                {TYPE_ICONS[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!n.isRead && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n.id); }}
                    className="p-1.5 text-gray-400 hover:text-primary rounded-md transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                  className="p-1.5 text-gray-400 hover:text-danger rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
