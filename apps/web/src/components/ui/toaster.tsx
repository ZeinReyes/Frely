'use client';

import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle className="h-5 w-5 text-secondary" />,
  error:   <AlertCircle className="h-5 w-5 text-danger" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  default: <Info className="h-5 w-5 text-info" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-4 bg-white rounded-lg shadow-modal border animate-slide-up',
            t.variant === 'error'   && 'border-red-200',
            t.variant === 'success' && 'border-green-200',
            t.variant === 'warning' && 'border-amber-200',
            t.variant === 'default' && 'border-gray-200'
          )}
        >
          <span className="shrink-0 mt-0.5">{icons[t.variant]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
