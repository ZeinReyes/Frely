'use client';

import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { useActiveTimer, useStopTimer } from '@/hooks/useTimeEntries';
import { cn } from '@/lib/utils';

function useElapsedTime(startTime?: string) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) { setElapsed(0); return; }

    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsed(diff);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerWidget() {
  const { data }     = useActiveTimer();
  const stopTimer    = useStopTimer();
  const activeEntry  = data?.entry;
  const elapsed      = useElapsedTime(activeEntry?.startTime);

  if (!activeEntry) return null;

  return (
    <div className="mx-3 mb-3 bg-primary-50 border border-primary-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-medium text-primary">Timer running</span>
      </div>

      <p className="text-xs text-gray-600 truncate mb-1">
        {activeEntry.project?.name}
        {activeEntry.task && ` · ${activeEntry.task.title}`}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-lg font-mono font-bold text-primary">
          {formatElapsed(elapsed)}
        </span>
        <button
          onClick={() => stopTimer.mutate()}
          disabled={stopTimer.isPending}
          className="flex items-center gap-1 px-2 py-1 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          <Square className="h-3 w-3" />
          Stop
        </button>
      </div>
    </div>
  );
}
