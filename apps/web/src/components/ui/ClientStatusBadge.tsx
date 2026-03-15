import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/types/client';

const STATUS_CONFIG: Record<ClientStatus, { label: string; className: string }> = {
  LEAD:          { label: 'Lead',          className: 'bg-blue-100 text-blue-800' },
  PROPOSAL_SENT: { label: 'Proposal Sent', className: 'bg-purple-100 text-purple-800' },
  ACTIVE:        { label: 'Active',        className: 'bg-green-100 text-green-800' },
  COMPLETED:     { label: 'Completed',     className: 'bg-gray-100 text-gray-700' },
  INACTIVE:      { label: 'Inactive',      className: 'bg-red-100 text-red-700' },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('badge', config.className)}>
      {config.label}
    </span>
  );
}