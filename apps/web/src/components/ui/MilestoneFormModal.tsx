'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateMilestone, useUpdateMilestone } from '@/hooks/useMilestones';
import type { Milestone } from '@/types/milestone';

const schema = z.object({
  title:       z.string().min(1, 'Title is required').trim(),
  description: z.string().optional(),
  dueDate:     z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface MilestoneFormModalProps {
  projectId:  string;
  milestone?: Milestone;
  onClose:    () => void;
}

export function MilestoneFormModal({ projectId, milestone, onClose }: MilestoneFormModalProps) {
  const isEdit          = !!milestone;
  const createMilestone = useCreateMilestone(projectId);
  const updateMilestone = useUpdateMilestone(milestone?.id || '', projectId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       milestone?.title       || '',
      description: milestone?.description || '',
      dueDate:     milestone?.dueDate     ? milestone.dueDate.split('T')[0] : '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      projectId,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    };

    if (isEdit) {
      const { projectId: _, ...rest } = payload;
      await updateMilestone.mutateAsync(rest);
    } else {
      await createMilestone.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit milestone' : 'New milestone'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label="Milestone title"
            placeholder="e.g. Phase 1 — Design"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              placeholder="What needs to be delivered in this milestone?"
              className="input resize-none"
              {...register('description')}
            />
          </div>

          <Input
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || createMilestone.isPending || updateMilestone.isPending}
            >
              {isEdit ? 'Save changes' : 'Create milestone'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
