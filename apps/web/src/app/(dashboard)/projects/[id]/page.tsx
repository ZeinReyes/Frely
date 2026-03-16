'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, Plus, Users,
  Calendar, DollarSign, LayoutGrid,
} from 'lucide-react';
import { useProject, useKanbanBoard, useDeleteProject } from '@/hooks/useProjects';
import { KanbanBoardView } from '@/components/ui/KanbanBoard';
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge';
import { ProjectFormModal } from '@/components/ui/ProjectFormModal';
import { TaskFormModal } from '@/components/ui/TaskFormModal';
import { MilestoneTracker } from '@/components/ui/MilestoneTracker';
import { AIProjectSummary } from '@/components/ui/AIProjectSummary';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FileBrowser } from '@/components/ui/FileBrowser';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [showEdit,      setShowEdit]      = useState(false);
  const [showAddTask,   setShowAddTask]   = useState(false);
  const [showDelete,    setShowDelete]    = useState(false);

  const { data: projectData, isLoading: projectLoading } = useProject(id);
  const { data: boardData,   isLoading: boardLoading }   = useKanbanBoard(id);
  const deleteProject = useDeleteProject();

  const project = projectData?.project;
  const board   = boardData?.board;

  const totalTasks = board
    ? board.TODO.length + board.IN_PROGRESS.length + board.REVIEW.length + board.DONE.length
    : 0;
  const doneTasks = board?.DONE.length || 0;
  const progress  = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const handleDelete = async () => {
    await deleteProject.mutateAsync(id);
    router.push('/projects');
  };

  if (projectLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div className="page-container"><p className="text-gray-500">Project not found.</p></div>;
  }

  return (
    <div className="page-container">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{getInitials(project.client.name)}</span>
              </div>
              {project.client.name}
            </span>
            {project.budget && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {formatCurrency(Number(project.budget))}
              </span>
            )}
            {project.endDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {formatDate(project.endDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setShowAddTask(true)}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{totalTasks} total tasks</span>
            <span>{doneTasks} completed</span>
            <span>{totalTasks - doneTasks} remaining</span>
          </div>
        </div>
      )}

      {/* AI Summary */}
      <div className="mb-6">
        <AIProjectSummary projectId={project.id} />
      </div>

      {/* Milestones */}
      <div className="card p-5 mb-6">
        <MilestoneTracker projectId={id} />
      </div>

      {/* Files */}
      <div className="card p-5 mb-6">
        <FileBrowser projectId={id} />
      </div>

      {/* Kanban board */}
      <div className="mb-2 flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700">Board</h2>
      </div>

      {boardLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : board ? (
        <KanbanBoardView projectId={id} board={board} />
      ) : null}

      {showDelete && (
        <ConfirmModal
          title="Delete project"
          description="Are you sure you want to delete this project? This will also delete all tasks, milestones, files, and time entries. This action cannot be undone."
          confirmLabel="Delete project"
          loading={deleteProject.isPending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
      {/* Modals */}
      {showEdit    && <ProjectFormModal project={project} onClose={() => setShowEdit(false)} />}
      {showAddTask && <TaskFormModal projectId={id} onClose={() => setShowAddTask(false)} />}
    </div>
  );
}