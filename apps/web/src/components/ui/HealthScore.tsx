import { cn } from '@/lib/utils';

interface HealthScoreProps {
  score:      number;
  showLabel?: boolean;
}

export function HealthScore({ score, showLabel = false }: HealthScoreProps) {
  const color =
    score >= 80 ? 'text-green-600 bg-green-100' :
    score >= 50 ? 'text-amber-600 bg-amber-100' :
                  'text-red-600 bg-red-100';

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
      )} />
      {showLabel && 'Health: '}{score}
    </span>
  );
}