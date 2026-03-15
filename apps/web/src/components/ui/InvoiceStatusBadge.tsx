import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/types/invoice';

const CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT:         { label: 'Draft',         className: 'bg-gray-100 text-gray-600' },
  SENT:          { label: 'Sent',          className: 'bg-blue-100 text-blue-700' },
  VIEWED:        { label: 'Viewed',        className: 'bg-purple-100 text-purple-700' },
  PARTIALLY_PAID:{ label: 'Partial',       className: 'bg-yellow-100 text-yellow-700' },
  PAID:          { label: 'Paid',          className: 'bg-green-100 text-green-700' },
  OVERDUE:       { label: 'Overdue',       className: 'bg-red-100 text-red-700' },
  CANCELLED:     { label: 'Cancelled',     className: 'bg-gray-100 text-gray-500' },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = CONFIG[status] || CONFIG.DRAFT;
  return <span className={cn('badge', config.className)}>{config.label}</span>;
}
