'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTask, useUpdateTask } from '@/hooks/useProjects';
import { useMilestones } from '@/hooks/useMilestones';
import type { Task, TaskStatus } from '@/types/project';

const schema = z.object({
  title:           z.string().min(1, 'Title is required').trim(),
  description:     z.string().optional(),
  status:          z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  priority:        z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate:         z.string().optional(),
  milestoneId:     z.string().optional(),
  isClientVisible: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface TaskFormModalProps {
  projectId:      string;
  task?:          Task;
  defaultStatus?: TaskStatus;
  onClose:        () => void;
}

export function TaskFormModal({ projectId, task, defaultStatus = 'TODO', onClose }: TaskFormModalProps) {
  const isEdit     = !!task;
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(task?.id || '', projectId);

  const { data: milestonesData } = useMilestones(projectId);
  const milestones = milestonesData?.milestones || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:           task?.title           || '',
      description:     task?.description     || '',
      status:          task?.status          || defaultStatus,
      priority:        task?.priority        || 'MEDIUM',
      dueDate:         task?.dueDate         ? task.dueDate.split('T')[0] : '',
      milestoneId:     task?.milestoneId     || '',
      isClientVisible: task?.isClientVisible ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      projectId,
      milestoneId: data.milestoneId || undefined,
      dueDate:     data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    };

    if (isEdit) {
      await updateTask.mutateAsync(payload);
    } else {
      await createTask.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit task' : 'New task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label="Task title"
            placeholder="What needs to be done?"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              placeholder="Add more details..."
              className="input resize-none"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className="input" {...register('status')}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select className="input" {...register('priority')}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Milestone */}
          {milestones.length > 0 && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Milestone</label>
              <select className="input" {...register('milestoneId')}>
                <option value="">No milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="clientVisible"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...register('isClientVisible')}
            />
            <label htmlFor="clientVisible" className="text-sm text-gray-700">
              Visible to client in portal
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || createTask.isPending || updateTask.isPending}
            >
              {isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}