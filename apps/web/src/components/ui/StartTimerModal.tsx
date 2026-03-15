'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStartTimer } from '@/hooks/useTimeEntries';
import { useProjects } from '@/hooks/useProjects';

const schema = z.object({
  projectId:   z.string().min(1, 'Please select a project'),
  description: z.string().optional(),
  isBillable:  z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface StartTimerModalProps {
  projectId?: string;
  taskId?:    string;
  taskTitle?: string;
  onClose:    () => void;
}

export function StartTimerModal({ projectId, taskId, taskTitle, onClose }: StartTimerModalProps) {
  const startTimer = useStartTimer();
  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId:   projectId || '',
      description: taskTitle  ? `Working on: ${taskTitle}` : '',
      isBillable:  true,
    },
  });

  const onSubmit = async (data: FormData) => {
    await startTimer.mutateAsync({
      projectId:   data.projectId,
      taskId,
      description: data.description,
      isBillable:  data.isBillable,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Start timer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {!projectId && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Project <span className="text-danger">*</span>
              </label>
              <select className="input" {...register('projectId')}>
                <option value="">Select project...</option>
                {projects.map((p: { id: string; name: string }) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-xs text-danger">{errors.projectId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">What are you working on?</label>
            <input
              type="text"
              placeholder="e.g. Designing the homepage"
              className="input"
              {...register('description')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...register('isBillable')}
            />
            <label htmlFor="billable" className="text-sm text-gray-700">Billable</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || startTimer.isPending}
            >
              <Play className="h-4 w-4" />
              Start timer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
