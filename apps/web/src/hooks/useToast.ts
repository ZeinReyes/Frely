'use client';

import { useState, useEffect, useCallback } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface Toast {
  id:           string;
  title:        string;
  description?: string;
  variant:      ToastVariant;
}

// ─────────────────────────────────────────
// GLOBAL EVENT BUS — works across components
// ─────────────────────────────────────────
const TOAST_EVENT = 'vyrn:toast';

export function toast(opts: Omit<Toast, 'id'>) {
  if (typeof window === 'undefined') return;
  const id = Math.random().toString(36).slice(2);
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { ...opts, id } }));
}

toast.success = (title: string, description?: string) =>
  toast({ title, description, variant: 'success' });
toast.error = (title: string, description?: string) =>
  toast({ title, description, variant: 'error' });
toast.warning = (title: string, description?: string) =>
  toast({ title, description, variant: 'warning' });
toast.default = (title: string, description?: string) =>
  toast({ title, description, variant: 'default' });

// ─────────────────────────────────────────
// HOOK — used by Toaster to render
// ─────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const newToast = (e as CustomEvent<Toast>).detail;
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
