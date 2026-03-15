'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateContract } from '@/hooks/useProposals';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEFAULT_CONTRACT_BODY = `This agreement is entered into between the Service Provider and the Client.

1. SERVICES
The Service Provider agrees to perform the services as described in the project scope.

2. PAYMENT
Payment is due within 14 days of invoice. Late payments incur a 1.5% monthly fee.

3. INTELLECTUAL PROPERTY
Upon full payment, the Client receives full ownership of all deliverables created under this agreement.

4. REVISIONS
This agreement includes up to 2 rounds of revisions per deliverable.

5. CONFIDENTIALITY
Both parties agree to keep all project information confidential.

6. TERMINATION
Either party may terminate this agreement with 14 days written notice.

7. LIMITATION OF LIABILITY
The Service Provider's liability is limited to the total amount paid under this agreement.`;

const schema = z.object({
  clientId:  z.string().min(1, 'Please select a client'),
  title:     z.string().min(1, 'Title required'),
  body:      z.string().min(1, 'Contract body required'),
  currency:  z.string().default('USD'),
  value:     z.coerce.number().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewContractPage() {
  const router         = useRouter();
  const createContract = useCreateContract();
  const { data: clientsData } = useClients({ limit: 100 });
  const clients = clientsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'USD',
      body:     DEFAULT_CONTRACT_BODY,
    },
  });

  const onSubmit = async (data: FormData) => {
    await createContract.mutateAsync({
      ...data,
      value:     data.value ? Number(data.value) : undefined,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate:   data.endDate   ? new Date(data.endDate).toISOString()   : undefined,
    });
    router.push('/contracts');
  };

  return (
    <div className="page-container max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to contracts
      </button>

      <h1 className="page-title mb-6">New Contract</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Contract Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Client <span className="text-danger">*</span>
              </label>
              <select className="input" {...register('clientId')}>
                <option value="">Select client...</option>
                {clients.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clientId && <p className="text-xs text-danger">{errors.clientId.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select className="input" {...register('currency')}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="PHP">PHP — Philippine Peso</option>
              </select>
            </div>
          </div>
          <Input
            label="Contract title"
            placeholder="e.g. Web Development Agreement"
            required
            error={errors.title?.message}
            {...register('title')}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Contract value"
              type="number"
              placeholder="5000"
              {...register('value')}
            />
            <Input
              label="Start date"
              type="date"
              {...register('startDate')}
            />
            <Input
              label="End date"
              type="date"
              {...register('endDate')}
            />
          </div>
        </div>

        <div className="card p-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Contract Body <span className="text-danger">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">Edit the template below to match your terms</p>
            <textarea
              rows={20}
              className={`input resize-y font-mono text-sm ${errors.body ? 'border-danger' : ''}`}
              {...register('body')}
            />
            {errors.body && <p className="text-xs text-danger">{errors.body.message}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting || createContract.isPending}>
            Create contract
          </Button>
        </div>
      </form>
    </div>
  );
}
