import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/types/project';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  ACTIVE:    { label: 'Active',    className: 'bg-green-100 text-green-800' },
  ON_HOLD:   { label: 'On Hold',   className: 'bg-amber-100 text-amber-800' },
  COMPLETED: { label: 'Completed', className: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('badge', config.className)}>
      {config.label}
    </span>
  );
}
