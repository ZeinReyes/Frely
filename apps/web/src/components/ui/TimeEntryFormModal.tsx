'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTimeEntry } from '@/hooks/useTimeEntries';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';

const schema = z.object({
  projectId:   z.string().min(1, 'Please select a project'),
  description: z.string().optional(),
  startTime:   z.string().min(1, 'Start time is required'),
  endTime:     z.string().min(1, 'End time is required'),
  isBillable:  z.boolean(),
}).refine(
  (d) => new Date(d.endTime) > new Date(d.startTime),
  { message: 'End time must be after start time', path: ['endTime'] }
);

type FormData = z.infer<typeof schema>;

interface TimeEntryFormModalProps {
  projectId?: string;
  onClose:    () => void;
}

function toDatetimeLocal(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimeEntryFormModal({ projectId, onClose }: TimeEntryFormModalProps) {
  const createEntry = useCreateTimeEntry();
  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.data || [];

  const now   = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId:   projectId || '',
      description: '',
      startTime:   toDatetimeLocal(oneHourAgo),
      endTime:     toDatetimeLocal(now),
      isBillable:  true,
    },
  });

  const onSubmit = async (data: FormData) => {
    await createEntry.mutateAsync({
      projectId:   data.projectId,
      description: data.description,
      startTime:   new Date(data.startTime).toISOString(),
      endTime:     new Date(data.endTime).toISOString(),
      isBillable:  data.isBillable,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add time entry</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Project */}
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
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              placeholder="What did you work on?"
              className="input"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Start time <span className="text-danger">*</span>
              </label>
              <input type="datetime-local" className="input" {...register('startTime')} />
              {errors.startTime && (
                <p className="text-xs text-danger">{errors.startTime.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                End time <span className="text-danger">*</span>
              </label>
              <input type="datetime-local" className="input" {...register('endTime')} />
              {errors.endTime && (
                <p className="text-xs text-danger">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...register('isBillable')}
            />
            <label htmlFor="billable" className="text-sm text-gray-700">
              Billable time
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || createEntry.isPending}
            >
              Add entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
