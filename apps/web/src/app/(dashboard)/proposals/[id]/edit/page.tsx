'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useProposal, useUpdateProposal } from '@/hooks/useProposals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity:    z.coerce.number().positive(),
  unitPrice:   z.coerce.number().positive(),
  amount:      z.coerce.number(),
});

const schema = z.object({
  title:        z.string().min(1, 'Title required'),
  introduction: z.string().optional(),
  scope:        z.string().optional(),
  terms:        z.string().optional(),
  notes:        z.string().optional(),
  currency:     z.string().default('USD'),
  validUntil:   z.string().optional(),
  lineItems:    z.array(lineItemSchema).min(1),
});

type FormData = z.infer<typeof schema>;

export default function EditProposalPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { data, isLoading } = useProposal(id);
  const updateProposal      = useUpdateProposal(id);

  const {
    register, control, handleSubmit, watch, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', lineItems: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');
  const currency  = watch('currency');

  const subtotal = lineItems?.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0) || 0;

  // Populate form when proposal loads
  useEffect(() => {
    const proposal = data?.proposal;
    if (!proposal) return;
    reset({
      title:        proposal.title,
      introduction: proposal.introduction || '',
      scope:        proposal.scope || '',
      terms:        proposal.terms || '',
      notes:        proposal.notes || '',
      currency:     proposal.currency,
      validUntil:   proposal.validUntil ? proposal.validUntil.split('T')[0] : '',
      lineItems:    (proposal.lineItems as { description: string; quantity: number; unitPrice: number; amount: number }[]),
    });
  }, [data, reset]);

  const updateAmount = (index: number) => {
    const item = lineItems[index];
    if (item) setValue(`lineItems.${index}.amount`, Number(item.quantity) * Number(item.unitPrice));
  };

  const onSubmit = async (formData: FormData) => {
    await updateProposal.mutateAsync({
      ...formData,
      lineItems: formData.lineItems.map(item => ({
        ...item,
        quantity:  Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount:    Number(item.quantity) * Number(item.unitPrice),
      })),
      validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
    });
    router.push(`/proposals/${id}`);
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data?.proposal && data.proposal.status !== 'DRAFT') {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Only draft proposals can be edited.</p>
        <button onClick={() => router.back()} className="text-primary text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="page-title mb-6">Edit Proposal</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select className="input" {...register('currency')}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PHP">PHP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
            <Input label="Valid until" type="date" {...register('validUntil')} />
          </div>
          <Input
            label="Proposal title"
            required
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        {/* Content */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Content</h2>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Introduction</label>
            <textarea rows={4} className="input resize-none" {...register('introduction')} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Scope of Work</label>
            <textarea rows={5} className="input resize-none" {...register('scope')} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
            <textarea rows={4} className="input resize-none" {...register('terms')} />
          </div>
        </div>

        {/* Line items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Line Items</h2>
            <Button
              type="button" size="sm" variant="secondary"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, amount: 0 })}
            >
              <Plus className="h-3.5 w-3.5" /> Add item
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1" />
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input className="input text-sm" placeholder="Description" {...register(`lineItems.${index}.description`)} />
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="0" step="1" className="input text-sm text-center"
                    {...register(`lineItems.${index}.quantity`)}
                    onChange={(e) => { register(`lineItems.${index}.quantity`).onChange(e); setTimeout(() => updateAmount(index), 0); }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="0" step="0.01" className="input text-sm text-right"
                    {...register(`lineItems.${index}.unitPrice`)}
                    onChange={(e) => { register(`lineItems.${index}.unitPrice`).onChange(e); setTimeout(() => updateAmount(index), 0); }}
                  />
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-gray-900">
                  {formatCurrency((Number(lineItems?.[index]?.quantity) || 0) * (Number(lineItems?.[index]?.unitPrice) || 0), currency)}
                </div>
                <div className="col-span-1 flex justify-center">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-danger transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3 flex justify-end">
              <div className="w-48">
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(subtotal, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea rows={3} className="input resize-none" {...register('notes')} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={isSubmitting || updateProposal.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
