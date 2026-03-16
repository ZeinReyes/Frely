'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useContract, useUpdateContract } from '@/hooks/useProposals';
import { AIContractModal } from '@/components/ui/AIContractModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  title:     z.string().min(1, 'Title required'),
  body:      z.string().min(1, 'Contract body required'),
  currency:  z.string().default('USD'),
  value:     z.coerce.number().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditContractPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { data, isLoading } = useContract(id);
  const updateContract      = useUpdateContract(id);
  const [showAI, setShowAI] = useState(false);

  const {
    register, handleSubmit, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD' },
  });

  useEffect(() => {
    const contract = data?.contract;
    if (!contract) return;
    reset({
      title:     contract.title,
      body:      contract.body,
      currency:  contract.currency,
      value:     contract.value ? Number(contract.value) : '',
      startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
      endDate:   contract.endDate   ? contract.endDate.split('T')[0]   : '',
    });
  }, [data, reset]);

  const onSubmit = async (formData: FormData) => {
    await updateContract.mutateAsync({
      ...formData,
      value:     formData.value ? Number(formData.value) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate:   formData.endDate   ? new Date(formData.endDate).toISOString()   : undefined,
    });
    router.push(`/contracts/${id}`);
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data?.contract && data.contract.status === 'SIGNED') {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Signed contracts cannot be edited.</p>
        <button onClick={() => router.back()} className="text-primary text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <>
      <div className="page-container max-w-3xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="page-title mb-6">Edit Contract</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Contract Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select className="input" {...register('currency')}>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="PHP">PHP — Philippine Peso</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                </select>
              </div>
              <Input label="Contract value" type="number" placeholder="5000" {...register('value')} />
            </div>
            <Input
              label="Contract title"
              required
              error={errors.title?.message}
              {...register('title')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start date" type="date" {...register('startDate')} />
              <Input label="End date"   type="date" {...register('endDate')} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Contract Body <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAI(true)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                ✨ AI suggest clauses
              </button>
            </div>
            <textarea
              rows={20}
              className={`input resize-y font-mono text-sm ${errors.body ? 'border-danger' : ''}`}
              {...register('body')}
            />
            {errors.body && <p className="text-xs text-danger">{errors.body.message}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting || updateContract.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </div>

      {showAI && (
        <AIContractModal
          onAccept={(clauses) => {
            const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
            const current  = textarea?.value || '';
            setValue('body', current + '\n\n' + clauses);
          }}
          onClose={() => setShowAI(false)}
        />
      )}
    </>
  );
}