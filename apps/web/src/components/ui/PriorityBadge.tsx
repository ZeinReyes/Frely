import { cn } from '@/lib/utils';
import type { Priority } from '@/types/project';

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string; dot: string }> = {
  LOW:      { label: 'Low',      className: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  MEDIUM:   { label: 'Medium',   className: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  HIGH:     { label: 'High',     className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
