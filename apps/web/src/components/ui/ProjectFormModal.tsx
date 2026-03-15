'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import type { Project } from '@/types/project';

const schema = z.object({
  clientId:    z.string().min(1, 'Please select a client'),
  name:        z.string().min(2, 'Name must be at least 2 characters').trim(),
  description: z.string().optional(),
  status:      z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  startDate:   z.string().optional(),
  endDate:     z.string().optional(),
  budget:      z.coerce.number().positive().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface ProjectFormModalProps {
  project?:         Project;
  defaultClientId?: string;
  onClose:          () => void;
}

export function ProjectFormModal({ project, defaultClientId, onClose }: ProjectFormModalProps) {
  const isEdit       = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(project?.id || '');
  const { data: clientsData } = useClients({ limit: 100 });
  const clients = clientsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId:    project?.clientId    || defaultClientId || '',
      name:        project?.name        || '',
      description: project?.description || '',
      status:      project?.status      || 'ACTIVE',
      startDate:   project?.startDate   ? project.startDate.split('T')[0] : '',
      endDate:     project?.endDate     ? project.endDate.split('T')[0]   : '',
      budget:      project?.budget      || '',
    },
  });

  useEffect(() => {
    if (project) reset({
      clientId:    project.clientId,
      name:        project.name,
      description: project.description || '',
      status:      project.status,
      startDate:   project.startDate ? project.startDate.split('T')[0] : '',
      endDate:     project.endDate   ? project.endDate.split('T')[0]   : '',
      budget:      project.budget    || '',
    });
  }, [project, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      budget:    data.budget ? Number(data.budget) : undefined,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate:   data.endDate   ? new Date(data.endDate).toISOString()   : undefined,
    };

    if (isEdit) {
      const { clientId: _, ...rest } = payload;
      await updateProject.mutateAsync(rest);
    } else {
      await createProject.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit project' : 'New project'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Client */}
          {!isEdit && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Client <span className="text-danger">*</span>
              </label>
              <select className="input" {...register('clientId')}>
                <option value="">Select a client...</option>
                {clients.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clientId && <p className="text-xs text-danger">{errors.clientId.message}</p>}
            </div>
          )}

          <Input
            label="Project name"
            placeholder="Website Redesign"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the project..."
              className="input resize-none"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className="input" {...register('status')}>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <Input
              label="Budget ($)"
              type="number"
              placeholder="5000"
              error={errors.budget?.message}
              {...register('budget')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start date"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <Input
              label="End date"
              type="date"
              error={errors.endDate?.message}
              {...register('endDate')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || createProject.isPending || updateProject.isPending}
            >
              {isEdit ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
