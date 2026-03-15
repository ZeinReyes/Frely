'use client';

import { useState } from 'react';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Calendar, CheckCircle2, Circle, Clock, Flag,
} from 'lucide-react';
import { useMilestones, useUpdateMilestoneStatus, useDeleteMilestone } from '@/hooks/useMilestones';
import { MilestoneStatusBadge } from '@/components/ui/MilestoneStatusBadge';
import { MilestoneFormModal } from '@/components/ui/MilestoneFormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Milestone, MilestoneStatus } from '@/types/milestone';

const STATUS_FLOW: MilestoneStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'AWAITING_APPROVAL',
  'APPROVED',
  'COMPLETED',
];

const STATUS_ICONS: Record<MilestoneStatus, React.ReactNode> = {
  PENDING:           <Circle className="h-5 w-5 text-gray-400" />,
  IN_PROGRESS:       <Clock className="h-5 w-5 text-blue-500" />,
  AWAITING_APPROVAL: <Flag className="h-5 w-5 text-amber-500" />,
  APPROVED:          <CheckCircle2 className="h-5 w-5 text-green-500" />,
  COMPLETED:         <CheckCircle2 className="h-5 w-5 text-primary" />,
};

function MilestoneProgress({ tasks }: { tasks?: { status: string }[] }) {
  if (!tasks || tasks.length === 0) return null;
  const done     = tasks.filter(t => t.status === 'DONE').length;
  const progress = Math.round((done / tasks.length) * 100);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>{done}/{tasks.length} tasks</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface MilestoneItemProps {
  milestone:   Milestone;
  projectId:   string;
  onEdit:      (m: Milestone) => void;
  onDelete:    (m: Milestone) => void;
}

function MilestoneItem({ milestone, projectId, onEdit, onDelete }: MilestoneItemProps) {
  const [expanded,  setExpanded]  = useState(false);
  const [showMenu,  setShowMenu]  = useState(false);
  const updateStatus = useUpdateMilestoneStatus(projectId);

  const currentIndex = STATUS_FLOW.indexOf(milestone.status);
  const nextStatus   = STATUS_FLOW[currentIndex + 1] as MilestoneStatus | undefined;
  const canAdvance   = !!nextStatus && milestone.status !== 'COMPLETED';

  const handleAdvance = async () => {
    if (!nextStatus) return;
    await updateStatus.mutateAsync({ id: milestone.id, status: nextStatus });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-white hover:bg-gray-50 transition-colors">
        {/* Status icon */}
        <button
          onClick={handleAdvance}
          disabled={!canAdvance || updateStatus.isPending}
          title={canAdvance ? `Mark as ${nextStatus?.replace('_', ' ')}` : 'Completed'}
          className="mt-0.5 shrink-0 disabled:cursor-default"
        >
          {STATUS_ICONS[milestone.status]}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900">{milestone.title}</h4>
            <MilestoneStatusBadge status={milestone.status} />
            {milestone.dueDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(milestone.dueDate)}
              </span>
            )}
          </div>

          {milestone.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{milestone.description}</p>
          )}

          <MilestoneProgress tasks={milestone.tasks} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {milestone.tasks && milestone.tasks.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded
                ? <ChevronDown className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />
              }
            </button>
          )}
          <button
            onClick={() => onEdit(milestone)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(milestone)}
            className="p-1 text-gray-400 hover:text-danger transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Advance status button */}
      {canAdvance && (
        <div className="px-4 pb-3 pt-0 bg-white">
          <button
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
            className="text-xs text-primary hover:text-primary-600 font-medium transition-colors"
          >
            → Mark as {nextStatus?.replace(/_/g, ' ')}
          </button>
        </div>
      )}

      {/* Expanded task list */}
      {expanded && milestone.tasks && milestone.tasks.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <ul className="space-y-1">
            {milestone.tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  task.status === 'DONE' ? 'bg-secondary border-secondary' : 'border-gray-300'
                }`}>
                  {task.status === 'DONE' && (
                    <span className="text-white" style={{ fontSize: '8px' }}>✓</span>
                  )}
                </span>
                <span className={task.status === 'DONE' ? 'line-through text-gray-400' : ''}>
                  {(task as { id: string; status: string; title?: string }).title || task.id}
                </span>
                <span className="ml-auto badge-default text-xs">{task.status.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// MILESTONE TRACKER (main component)
// ─────────────────────────────────────────
interface MilestoneTrackerProps {
  projectId: string;
}

export function MilestoneTracker({ projectId }: MilestoneTrackerProps) {
  const [showCreate,       setShowCreate]       = useState(false);
  const [editMilestone,    setEditMilestone]    = useState<Milestone | null>(null);
  const [deleteMilestone,  setDeleteMilestone]  = useState<Milestone | null>(null);
  const deleteMilestoneMutation = useDeleteMilestone(projectId);

  const { data, isLoading } = useMilestones(projectId);
  const milestones = data?.milestones || [];

  const handleDelete = async () => {
    if (!deleteMilestone) return;
    await deleteMilestoneMutation.mutateAsync(deleteMilestone.id);
    setDeleteMilestone(null);
  };

  // Overall project milestone progress
  const completed = milestones.filter(m => m.status === 'COMPLETED').length;
  const total     = milestones.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">
            Milestones
            {total > 0 && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {completed}/{total} completed
              </span>
            )}
          </h2>
          {total > 0 && (
            <div className="mt-1.5 h-1.5 w-48 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.round((completed / total) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </Button>
      </div>

      {/* Milestone list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-400 mb-3">No milestones yet</p>
          <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> Add first milestone
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              projectId={projectId}
              onEdit={setEditMilestone}
              onDelete={setDeleteMilestone}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <MilestoneFormModal
          projectId={projectId}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editMilestone && (
        <MilestoneFormModal
          projectId={projectId}
          milestone={editMilestone}
          onClose={() => setEditMilestone(null)}
        />
      )}
      {deleteMilestone && (
        <ConfirmModal
          title="Delete milestone"
          description={`Are you sure you want to delete "${deleteMilestone.title}"? Tasks linked to this milestone will be unlinked but not deleted.`}
          confirmLabel="Delete milestone"
          loading={deleteMilestoneMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteMilestone(null)}
        />
      )}
    </div>
  );
}
