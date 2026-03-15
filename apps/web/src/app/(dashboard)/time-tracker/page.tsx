'use client';

import { useState } from 'react';
import {
  Plus, Play, Square, Clock, DollarSign,
  Pencil, Trash2, Timer,
} from 'lucide-react';
import { useTimeEntries, useActiveTimer, useStartTimer, useStopTimer, useDeleteTimeEntry } from '@/hooks/useTimeEntries';
import { TimeEntryFormModal } from '@/components/ui/TimeEntryFormModal';
import { StartTimerModal } from '@/components/ui/StartTimerModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { TimeEntry } from '@/types/timeEntry';

function formatDuration(seconds?: number): string {
  if (!seconds) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatHours(seconds: number): string {
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default function TimeTrackerPage() {
  const [showAdd,        setShowAdd]        = useState(false);
  const [showStart,      setShowStart]      = useState(false);
  const [deleteEntry,    setDeleteEntry]    = useState<TimeEntry | null>(null);

  const { data: activeData }  = useActiveTimer();
  const { data, isLoading }   = useTimeEntries({ limit: 50 });
  const stopTimer              = useStopTimer();
  const deleteTimeEntry        = useDeleteTimeEntry();

  const activeTimer  = activeData?.entry;
  const entries: TimeEntry[] = data?.data || [];
  const summary = data?.summary || { totalSeconds: 0, billableSeconds: 0 };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    await deleteTimeEntry.mutateAsync(deleteEntry.id);
    setDeleteEntry(null);
  };

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.startTime).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Time Tracker</h1>
          <p className="page-subtitle">Track billable and non-billable time across projects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add entry
          </Button>
          {activeTimer ? (
            <Button variant="danger" onClick={() => stopTimer.mutate()} loading={stopTimer.isPending}>
              <Square className="h-4 w-4" /> Stop timer
            </Button>
          ) : (
            <Button onClick={() => setShowStart(true)}>
              <Play className="h-4 w-4" /> Start timer
            </Button>
          )}
        </div>
      </div>

      {/* Active timer banner */}
      {activeTimer && (
        <ActiveTimerBanner
          entry={activeTimer}
          onStop={() => stopTimer.mutate()}
          stopping={stopTimer.isPending}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Total time</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatHours(summary.totalSeconds)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-500" />
            <p className="text-sm text-gray-500">Billable time</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatHours(summary.billableSeconds)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Non-billable</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatHours(summary.totalSeconds - summary.billableSeconds)}
          </p>
        </div>
      </div>

      {/* Entries list */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No time entries yet</h3>
          <p className="text-sm text-gray-500 mb-6">Start tracking time on your projects</p>
          <Button onClick={() => setShowStart(true)}>
            <Play className="h-4 w-4" /> Start timer
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEntries]) => {
            const dayTotal = dayEntries.reduce((s, e) => s + (e.duration || 0), 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <span className="text-sm text-gray-500">{formatHours(dayTotal)}</span>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-100">
                      {dayEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {entry.description || <span className="text-gray-400 italic">No description</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {entry.project?.name}
                              {entry.task && ` · ${entry.task.title}`}
                            </p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`badge ${entry.isBillable ? 'badge-success' : 'badge-default'}`}>
                              {entry.isBillable ? 'Billable' : 'Non-billable'}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                            {new Date(entry.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {' – '}
                            {entry.endTime
                              ? new Date(entry.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                              : 'running'
                            }
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-mono font-medium text-gray-900">
                              {formatDuration(entry.duration)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDeleteEntry(entry)}
                              className="p-1 text-gray-400 hover:text-danger transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAdd   && <TimeEntryFormModal onClose={() => setShowAdd(false)} />}
      {showStart && <StartTimerModal    onClose={() => setShowStart(false)} />}
      {deleteEntry && (
        <ConfirmModal
          title="Delete time entry"
          description="Are you sure you want to delete this time entry? This action cannot be undone."
          confirmLabel="Delete entry"
          loading={deleteTimeEntry.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteEntry(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// ACTIVE TIMER BANNER
// ─────────────────────────────────────────
function ActiveTimerBanner({
  entry,
  onStop,
  stopping,
}: {
  entry:    TimeEntry;
  onStop:   () => void;
  stopping: boolean;
}) {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000)
  );

  useState(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  });

  return (
    <div className="card p-4 mb-6 border-primary-200 bg-primary-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {entry.description || 'Timer running'}
            </p>
            <p className="text-xs text-gray-500">
              {entry.project?.name}
              {entry.task && ` · ${entry.task.title}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold text-primary">
            {formatDuration(elapsed)}
          </span>
          <Button variant="danger" size="sm" onClick={onStop} loading={stopping}>
            <Square className="h-4 w-4" /> Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
