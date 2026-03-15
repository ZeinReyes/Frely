'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Send, CheckCircle2, Clock } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface Reminder {
  id:        string;
  type:      string;
  sentAt:    string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  DUE_SOON:   '3 days before due',
  DUE_TODAY:  'Due today',
  OVERDUE_7:  '7 days overdue',
  OVERDUE_14: '14 days overdue',
  MANUAL:     'Manual reminder',
};

interface Props {
  invoiceId: string;
  status:    string;
  hasDueDate: boolean;
}

export function ReminderPanel({ invoiceId, status, hasDueDate }: Props) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  const [enabled, setEnabled] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reminders', invoiceId],
    queryFn:  async () => {
      const { data } = await api.get(`/api/invoices/${invoiceId}/reminders`);
      return data.data.reminders as Reminder[];
    },
    enabled: status !== 'DRAFT',
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/invoices/${invoiceId}/reminders/enable`);
    },
    onSuccess: () => {
      setEnabled(true);
      toast({ title: 'Auto-reminders enabled', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['reminders', invoiceId] });
    },
    onError: () => toast({ title: 'Failed to enable reminders', variant: 'error' }),
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/invoices/${invoiceId}/reminders/disable`);
    },
    onSuccess: () => {
      setEnabled(false);
      toast({ title: 'Reminders disabled', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to disable reminders', variant: 'error' }),
  });

  const sendNowMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/invoices/${invoiceId}/reminders/send`);
    },
    onSuccess: () => {
      toast({ title: 'Reminder queued — will send shortly', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['reminders', invoiceId] });
    },
    onError: () => toast({ title: 'Failed to queue reminder', variant: 'error' }),
  });

  const reminders = data || [];
  const isPaid    = status === 'PAID';

  if (status === 'DRAFT') return null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" /> Reminders
        </h3>
        {!isPaid && (
          <div className="flex gap-2">
            {!enabled ? (
              <button
                onClick={() => enableMutation.mutate()}
                disabled={!hasDueDate || enableMutation.isPending}
                title={!hasDueDate ? 'Add a due date to enable auto-reminders' : ''}
                className="text-xs text-primary hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {enableMutation.isPending ? 'Enabling...' : 'Enable auto'}
              </button>
            ) : (
              <button
                onClick={() => disableMutation.mutate()}
                disabled={disableMutation.isPending}
                className="text-xs text-gray-500 hover:underline"
              >
                Disable
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reminder history */}
      {isLoading ? (
        <div className="text-xs text-gray-400">Loading...</div>
      ) : reminders.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3">No reminders sent yet.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-xs">
              {r.sentAt
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                : <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              }
              <span className="text-gray-700">{TYPE_LABELS[r.type] || r.type}</span>
              {r.sentAt && (
                <span className="text-gray-400 ml-auto">{formatDate(r.sentAt)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual send */}
      {!isPaid && (
        <button
          onClick={() => sendNowMutation.mutate()}
          disabled={sendNowMutation.isPending}
          className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {sendNowMutation.isPending ? 'Sending...' : 'Send reminder now'}
        </button>
      )}

      {!hasDueDate && !isPaid && (
        <p className="text-xs text-gray-400 mt-2">
          Add a due date to enable automatic reminders.
        </p>
      )}
    </div>
  );
}
