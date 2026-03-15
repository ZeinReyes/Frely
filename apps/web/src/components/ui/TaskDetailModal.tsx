'use client';

import { useState } from 'react';
import { X, MessageSquare, Pencil, Trash2, Calendar, Eye, EyeOff } from 'lucide-react';
import { useTask, useTaskComments, useCreateComment, useDeleteTask } from '@/hooks/useProjects';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Button } from '@/components/ui/button';
import { TaskFormModal } from '@/components/ui/TaskFormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate } from '@/lib/utils';
import type { SubTask } from '@/types/project';

interface TaskDetailModalProps {
  taskId:    string;
  projectId: string;
  onClose:   () => void;
}

export function TaskDetailModal({ taskId, projectId, onClose }: TaskDetailModalProps) {
  const [showEdit,       setShowEdit]       = useState(false);
  const [showDelete,     setShowDelete]     = useState(false);
  const [comment,        setComment]        = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  const { data: taskData }     = useTask(taskId);
  const { data: commentsData } = useTaskComments(taskId);
  const createComment          = useCreateComment(taskId);
  const deleteTask             = useDeleteTask(projectId);

  const task     = taskData?.task;
  const comments = commentsData?.comments || [];

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await createComment.mutateAsync(comment.trim());
    setComment('');
    setSubmitting(false);
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(taskId);
    onClose();
  };

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl p-8 flex items-center justify-center w-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (showEdit) {
    return <TaskFormModal projectId={projectId} task={task} onClose={() => setShowEdit(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <PriorityBadge priority={task.priority} />
              <span className="badge-default">{task.status.replace('_', ' ')}</span>
              {task.dueDate && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {task.isClientVisible
                  ? <><Eye className="h-3 w-3 text-green-500" /> Visible to client</>
                  : <><EyeOff className="h-3 w-3 text-gray-400" /> Hidden from client</>
                }
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {task.description ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No description added.</p>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Subtasks ({task.subtasks.filter((s: SubTask) => s.status === 'DONE').length}/{task.subtasks.length})
              </h3>
              <ul className="space-y-1">
                {task.subtasks.map((sub: SubTask) => (
                  <li key={sub.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                      sub.status === 'DONE' ? 'bg-secondary border-secondary' : 'border-gray-300'
                    }`}>
                      {sub.status === 'DONE' && <span className="text-white text-xs">✓</span>}
                    </span>
                    <span className={sub.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-700'}>
                      {sub.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c: { id: string; content: string; createdAt: string }) => (
                  <li key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">Y</span>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{c.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(c.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex gap-2">
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="input resize-none flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handleComment();
                }}
              />
              <Button
                onClick={handleComment}
                loading={submitting}
                disabled={!comment.trim()}
                size="sm"
                className="self-end"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showDelete && (
        <ConfirmModal
          title="Delete task"
          description="Are you sure you want to delete this task? This will also delete all comments and subtasks. This action cannot be undone."
          confirmLabel="Delete task"
          loading={deleteTask.isPending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}