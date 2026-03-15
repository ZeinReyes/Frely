'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateClient, useUpdateClient } from '@/hooks/useClients';
import type { Client } from '@/types/client';

const schema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters').trim(),
  email:   z.string().email('Invalid email address'),
  phone:   z.string().optional(),
  company: z.string().optional(),
  notes:   z.string().optional(),
  status:  z.enum(['LEAD', 'PROPOSAL_SENT', 'ACTIVE', 'COMPLETED', 'INACTIVE']),
});

type FormData = z.infer<typeof schema>;

interface ClientFormModalProps {
  client?:  Client;
  onClose:  () => void;
}

export function ClientFormModal({ client, onClose }: ClientFormModalProps) {
  const isEdit       = !!client;
  const createClient = useCreateClient();
  const updateClient = useUpdateClient(client?.id || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:    client?.name    || '',
      email:   client?.email   || '',
      phone:   client?.phone   || '',
      company: client?.company || '',
      notes:   client?.notes   || '',
      status:  client?.status  || 'LEAD',
    },
  });

  useEffect(() => {
    if (client) reset({
      name:    client.name,
      email:   client.email,
      phone:   client.phone   || '',
      company: client.company || '',
      notes:   client.notes   || '',
      status:  client.status,
    });
  }, [client, reset]);

  const onSubmit = async (data: FormData) => {
    if (isEdit) {
      await updateClient.mutateAsync(data);
    } else {
      await createClient.mutateAsync(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-modal w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit client' : 'Add new client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Full name"
                placeholder="Jane Smith"
                required
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Email address"
                type="email"
                placeholder="jane@company.com"
                required
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <Input
              label="Phone"
              type="tel"
              placeholder="+1 234 567 8900"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Company"
              placeholder="Acme Inc."
              error={errors.company?.message}
              {...register('company')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select className="input" {...register('status')}>
              <option value="LEAD">Lead</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              placeholder="Any additional notes about this client..."
              className="input resize-none"
              {...register('notes')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isSubmitting || createClient.isPending || updateClient.isPending}
            >
              {isEdit ? 'Save changes' : 'Add client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}