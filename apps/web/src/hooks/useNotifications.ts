'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Notification {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  isRead:    boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────
export const NOTIF_KEYS = {
  all:   ['notifications'] as const,
  list:  () => ['notifications', 'list'] as const,
  count: () => ['notifications', 'count'] as const,
};

// ─────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEYS.list(),
    queryFn:  async () => {
      const { data } = await api.get('/api/notifications?limit=20');
      return data.data.notifications as Notification[];
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIF_KEYS.count(),
    queryFn:  async () => {
      const { data } = await api.get('/api/notifications/unread-count');
      return data.data.count as number;
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.all });
    },
  });
}

// ─────────────────────────────────────────
// SSE HOOK — real-time updates
// ─────────────────────────────────────────
export function useNotificationStream() {
  const queryClient   = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${API_URL}/api/notifications/stream`, {
      withCredentials: true,
    });

    es.onopen = () => setConnected(true);

    es.addEventListener('notification', (e) => {
      const notification = JSON.parse(e.data) as Notification;

      // Add to list
      queryClient.setQueryData(NOTIF_KEYS.list(), (old: Notification[] = []) => [
        notification,
        ...old,
      ]);

      // Increment count
      queryClient.setQueryData(NOTIF_KEYS.count(), (old: number = 0) => old + 1);
    });

    es.addEventListener('unread_count', (e) => {
      const { count } = JSON.parse(e.data) as { count: number };
      queryClient.setQueryData(NOTIF_KEYS.count(), count);
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 5s
      setTimeout(connect, 5000);
    };

    eventSourceRef.current = es;
  }, [queryClient]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
