import { cn } from '@/lib/utils';
import type { MilestoneStatus } from '@/types/milestone';

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; className: string }> = {
  PENDING:            { label: 'Pending',            className: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS:        { label: 'In Progress',        className: 'bg-blue-100 text-blue-700' },
  AWAITING_APPROVAL:  { label: 'Awaiting Approval',  className: 'bg-amber-100 text-amber-700' },
  APPROVED:           { label: 'Approved',           className: 'bg-green-100 text-green-700' },
  COMPLETED:          { label: 'Completed',          className: 'bg-primary-100 text-primary-700' },
};

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('badge', config.className)}>
      {config.label}
    </span>
  );
}
