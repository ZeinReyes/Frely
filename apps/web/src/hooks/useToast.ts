'use client';

import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

// Simple global toast state
let toastFn: ((opts: Omit<Toast, 'id'>) => void) | null = null;

export function useToast(): ToastState {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { ...opts, id };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  toastFn = toast;

  return { toasts, toast, dismiss };
}

// Standalone toast — call from anywhere
export const toast = {
  success: (title: string, description?: string) =>
    toastFn?.({ title, description, variant: 'success' }),
  error: (title: string, description?: string) =>
    toastFn?.({ title, description, variant: 'error' }),
  warning: (title: string, description?: string) =>
    toastFn?.({ title, description, variant: 'warning' }),
  default: (title: string, description?: string) =>
    toastFn?.({ title, description, variant: 'default' }),
};
