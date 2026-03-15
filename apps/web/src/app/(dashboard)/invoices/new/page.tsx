'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
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
  clientId:  z.string().min(1, 'Please select a client'),
  title:     z.string().min(1, 'Title required'),
  currency:  z.string().default('USD'),
  taxRate:   z.coerce.number().min(0).max(100).default(0),
  discount:  z.coerce.number().min(0).default(0),
  dueDate:   z.string().optional(),
  notes:     z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

type FormData = z.infer<typeof schema>;

export default function NewInvoicePage() {
  const router        = useRouter();
  const createInvoice = useCreateInvoice();
  const { data: clientsData } = useClients({ limit: 100 });
  const clients = clientsData?.data || [];

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency:  'USD',
      taxRate:   0,
      discount:  0,
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');
  const currency  = watch('currency');
  const taxRate   = watch('taxRate') || 0;
  const discount  = watch('discount') || 0;

  const subtotal  = lineItems?.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0) || 0;
  const taxAmount = ((subtotal - Number(discount)) * Number(taxRate)) / 100;
  const total     = subtotal - Number(discount) + taxAmount;

  const updateAmount = (index: number) => {
    const item = lineItems[index];
    if (item) setValue(`lineItems.${index}.amount`, Number(item.quantity) * Number(item.unitPrice));
  };

  const onSubmit = async (data: FormData) => {
    await createInvoice.mutateAsync({
      ...data,
      lineItems: data.lineItems.map(item => ({
        ...item,
        quantity:  Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount:    Number(item.quantity) * Number(item.unitPrice),
      })),
      taxRate:  Number(data.taxRate),
      discount: Number(data.discount),
      dueDate:  data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    });
    router.push('/invoices');
  };

  return (
    <div className="page-container max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </button>

      <h1 className="page-title mb-6">New Invoice</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Invoice Details</h2>
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
                <option value="PHP">PHP — Philippine Peso</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
              </select>
            </div>
          </div>
          <Input
            label="Invoice title"
            placeholder="e.g. Website Redesign — Phase 1"
            required
            error={errors.title?.message}
            {...register('title')}
          />
          <Input
            label="Due date"
            type="date"
            {...register('dueDate')}
          />
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
                  <input
                    className="input text-sm"
                    placeholder="Description"
                    {...register(`lineItems.${index}.description`)}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="0" step="1"
                    className="input text-sm text-center"
                    {...register(`lineItems.${index}.quantity`)}
                    onChange={(e) => { register(`lineItems.${index}.quantity`).onChange(e); setTimeout(() => updateAmount(index), 0); }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="0" step="0.01"
                    className="input text-sm text-right"
                    {...register(`lineItems.${index}.unitPrice`)}
                    onChange={(e) => { register(`lineItems.${index}.unitPrice`).onChange(e); setTimeout(() => updateAmount(index), 0); }}
                  />
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency((Number(lineItems?.[index]?.quantity) || 0) * (Number(lineItems?.[index]?.unitPrice) || 0), currency)}
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

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 flex justify-end">
              <div className="w-56 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {Number(discount) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Discount</span>
                    <span className="text-green-600">-{formatCurrency(Number(discount), currency)}</span>
                  </div>
                )}
                {Number(taxRate) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax ({taxRate}%)</span>
                    <span>{formatCurrency(taxAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tax & Discount */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Tax & Discount</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tax rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
              {...register('taxRate')}
            />
            <Input
              label={`Discount (${currency})`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              {...register('discount')}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              className="input resize-none"
              placeholder="Payment instructions, bank details, or any other notes..."
              {...register('notes')}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={isSubmitting || createInvoice.isPending}>
            Create invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
