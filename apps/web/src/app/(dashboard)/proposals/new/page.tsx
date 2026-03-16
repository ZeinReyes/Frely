'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useCreateProposal } from '@/hooks/useProposals';
import { AIProposalModal } from '@/components/ui/AIProposalModal';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity:    z.coerce.number().positive('Must be positive'),
  unitPrice:   z.coerce.number().positive('Must be positive'),
  amount:      z.coerce.number(),
});

const schema = z.object({
  clientId:     z.string().min(1, 'Please select a client'),
  title:        z.string().min(1, 'Title required'),
  introduction: z.string().optional(),
  scope:        z.string().optional(),
  terms:        z.string().optional(),
  notes:        z.string().optional(),
  currency:     z.string().default('USD'),
  validUntil:   z.string().optional(),
  lineItems:    z.array(lineItemSchema).min(1, 'At least one line item required'),
});

type FormData = z.infer<typeof schema>;

export default function NewProposalPage() {
  const router         = useRouter();
  const createProposal = useCreateProposal();
  const [showAI, setShowAI] = useState(false);
  const { data: clientsData } = useClients({ limit: 100 });
  const clients = clientsData?.data || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency:  'USD',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');
  const currency  = watch('currency');

  const subtotal = lineItems?.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0) || 0;

  const updateAmount = (index: number) => {
    const item = lineItems[index];
    if (item) {
      setValue(`lineItems.${index}.amount`, Number(item.quantity) * Number(item.unitPrice));
    }
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      lineItems: data.lineItems.map(item => ({
        ...item,
        quantity:  Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount:    Number(item.quantity) * Number(item.unitPrice),
      })),
      validUntil: data.validUntil ? new Date(data.validUntil).toISOString() : undefined,
    };
    await createProposal.mutateAsync(payload);
    router.push('/proposals');
  };

  return (
    <>
      <div className="page-container max-w-4xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to proposals
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">New Proposal</h1>
          <button
            type="button"
            onClick={() => setShowAI(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <span>✨</span> Generate with AI
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
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
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="PHP">PHP — Philippine Peso</option>
                </select>
              </div>
            </div>
            <Input
              label="Proposal title"
              placeholder="e.g. Website Redesign Proposal"
              required
              error={errors.title?.message}
              {...register('title')}
            />
            <Input label="Valid until" type="date" {...register('validUntil')} />
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Content</h2>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Introduction</label>
              <textarea rows={4} className="input resize-none" placeholder="Introduce yourself and the proposal..." {...register('introduction')} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Scope of Work</label>
              <textarea rows={5} className="input resize-none" placeholder="Describe what you'll deliver..." {...register('scope')} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
              <textarea rows={4} className="input resize-none" placeholder="Payment terms, revisions, deadlines..." {...register('terms')} />
            </div>
          </div>

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
                    <input
                      className={`input text-sm ${errors.lineItems?.[index]?.description ? 'border-danger' : ''}`}
                      placeholder="Description"
                      {...register(`lineItems.${index}.description`)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="0" step="1"
                      className="input text-sm text-center"
                      {...register(`lineItems.${index}.quantity`)}
                      onChange={(e) => {
                        register(`lineItems.${index}.quantity`).onChange(e);
                        setTimeout(() => updateAmount(index), 0);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="0" step="0.01"
                      className="input text-sm text-right"
                      {...register(`lineItems.${index}.unitPrice`)}
                      onChange={(e) => {
                        register(`lineItems.${index}.unitPrice`).onChange(e);
                        setTimeout(() => updateAmount(index), 0);
                      }}
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(
                        (Number(lineItems?.[index]?.quantity) || 0) * (Number(lineItems?.[index]?.unitPrice) || 0),
                        currency
                      )}
                    </span>
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

          <div className="card p-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea rows={3} className="input resize-none" placeholder="Any additional notes for the client..." {...register('notes')} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting || createProposal.isPending}>
              Create proposal
            </Button>
          </div>
        </form>
      </div>

      {showAI && (
        <AIProposalModal
          clientName={clients.find((c: { id: string; name: string }) => c.id === watch('clientId'))?.name}
          currency={watch('currency')}
          onAccept={(result) => {
            reset({ ...watch(), ...result });
          }}
          onClose={() => setShowAI(false)}
        />
      )}
    </>
  );
}