'use client';

import { useState, useOptimistic } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Calendar, MessageSquare } from 'lucide-react';
import { useMoveTask } from '@/hooks/useProjects';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { TaskDetailModal } from '@/components/ui/TaskDetailModal';
import { TaskFormModal } from '@/components/ui/TaskFormModal';
import { formatDate } from '@/lib/utils';
import type { Task, TaskStatus, KanbanBoard } from '@/types/project';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO',        label: 'To Do',       color: 'bg-gray-100 text-gray-700' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { id: 'REVIEW',      label: 'Review',      color: 'bg-purple-100 text-purple-700' },
  { id: 'DONE',        label: 'Done',        color: 'bg-green-100 text-green-700' },
];

// ─────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────
function TaskCard({
  task,
  onClick,
}: {
  task:    Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-card cursor-pointer hover:shadow-md hover:border-primary-200 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</p>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PriorityBadge priority={task.priority} />

            {task.dueDate && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}

            {task._count && task._count.comments > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-gray-500">
                <MessageSquare className="h-3 w-3" />
                {task._count.comments}
              </span>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-xs text-gray-500">
                {task.subtasks.filter(s => s.status === 'DONE').length}/{task.subtasks.length} subtasks
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// KANBAN COLUMN — with useDroppable
// ─────────────────────────────────────────
function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  column:      typeof COLUMNS[0];
  tasks:       Task[];
  onTaskClick: (task: Task) => void;
  onAddTask:   () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${column.color}`}>
            {column.label}
          </span>
          <span className="text-xs text-gray-400 font-medium">{tasks.length}</span>
        </div>
        <button
          onClick={onAddTask}
          className="text-gray-400 hover:text-primary hover:bg-primary-50 rounded p-1 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-32 space-y-2 rounded-lg p-1 transition-colors ${
          isOver ? 'bg-primary-50 ring-2 ring-primary-200' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className={`h-20 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
            isOver ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
          }`}>
            <p className="text-xs text-gray-400">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// KANBAN BOARD
// ─────────────────────────────────────────
interface KanbanBoardProps {
  projectId: string;
  board:     KanbanBoard;
}

export function KanbanBoardView({ projectId, board }: KanbanBoardProps) {
  const [activeTask,   setActiveTask]   = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingStatus, setAddingStatus] = useState<TaskStatus | null>(null);
  const [localBoard,   setLocalBoard]   = useState<KanbanBoard>(board);
  const moveTask = useMoveTask(projectId);

  // Keep local board in sync when prop changes (after refetch)
  if (JSON.stringify(board) !== JSON.stringify(localBoard) && !activeTask) {
    setLocalBoard(board);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const allTasks = [
    ...localBoard.TODO,
    ...localBoard.IN_PROGRESS,
    ...localBoard.REVIEW,
    ...localBoard.DONE,
  ];

  const getTaskColumn = (taskId: string): TaskStatus => {
    if (localBoard.TODO.find(t => t.id === taskId))        return 'TODO';
    if (localBoard.IN_PROGRESS.find(t => t.id === taskId)) return 'IN_PROGRESS';
    if (localBoard.REVIEW.find(t => t.id === taskId))      return 'REVIEW';
    return 'DONE';
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId       = active.id as string;
    const overId       = over.id as string;
    const sourceColumn = getTaskColumn(taskId);
    const task         = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine target column
    let targetStatus: TaskStatus = sourceColumn;

    const isColumn = COLUMNS.find(c => c.id === overId);
    if (isColumn) {
      targetStatus = isColumn.id;
    } else {
      // Dropped on a task — use that task's column
      targetStatus = getTaskColumn(overId);
    }

    if (targetStatus === sourceColumn && overId === taskId) return;

    const targetPosition = localBoard[targetStatus].length;

    // Optimistic update — move card immediately in UI
    setLocalBoard(prev => {
      const newBoard = { ...prev };
      // Remove from source
      newBoard[sourceColumn] = prev[sourceColumn].filter(t => t.id !== taskId);
      // Add to target
      const updatedTask = { ...task, status: targetStatus };
      newBoard[targetStatus] = [...prev[targetStatus], updatedTask];
      return newBoard;
    });

    // Persist to API
    await moveTask.mutateAsync({
      taskId,
      input: { status: targetStatus, position: targetPosition },
    });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={localBoard[column.id]}
              onTaskClick={(task) => setSelectedTask(task)}
              onAddTask={() => setAddingStatus(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-white rounded-lg border border-primary-300 p-3 shadow-modal rotate-2 w-72 opacity-95">
              <p className="text-sm font-medium text-gray-900">{activeTask.title}</p>
              <div className="mt-2">
                <PriorityBadge priority={activeTask.priority} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask.id}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {addingStatus && (
        <TaskFormModal
          projectId={projectId}
          defaultStatus={addingStatus}
          onClose={() => setAddingStatus(null)}
        />
      )}
    </>
  );
}