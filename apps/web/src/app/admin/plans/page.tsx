'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Star, Eye, EyeOff, GripVertical } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id:          string;
  name:        string;
  displayName: string;
  description: string;
  price:       number;
  period:      string;
  isPopular:   boolean;
  isVisible:   boolean;
  features:    string[];
  limits:      { clients: number; projects: number; invoices: number };
  sortOrder:   number;
}

function PlanCard({ plan, onSave }: { plan: Plan; onSave: (id: string, data: Partial<Plan>) => void }) {
  const [form,    setForm]    = useState(plan);
  const [newFeat, setNewFeat] = useState('');
  const isDirty = JSON.stringify(form) !== JSON.stringify(plan);

  const updateFeat = (i: number, val: string) => {
    const updated = [...form.features];
    updated[i] = val;
    setForm({ ...form, features: updated });
  };

  const removeFeat = (i: number) => {
    setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) });
  };

  const addFeat = () => {
    if (!newFeat.trim()) return;
    setForm({ ...form, features: [...form.features, newFeat.trim()] });
    setNewFeat('');
  };

  return (
    <div className={`bg-gray-900 rounded-2xl border ${plan.isPopular ? 'border-primary' : 'border-gray-800'} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-gray-600" />
          <div>
            <h3 className="text-base font-bold text-white">{plan.name}</h3>
            <p className="text-xs text-gray-500">{plan.displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setForm({ ...form, isPopular: !form.isPopular })}
            title="Toggle popular"
            className={`p-1.5 rounded-lg transition-colors ${form.isPopular ? 'text-amber-400 bg-amber-900/20' : 'text-gray-500 hover:text-amber-400'}`}
          >
            <Star className="h-4 w-4" />
          </button>
          <button
            onClick={() => setForm({ ...form, isVisible: !form.isVisible })}
            title="Toggle visibility"
            className={`p-1.5 rounded-lg transition-colors ${form.isVisible ? 'text-green-400 bg-green-900/20' : 'text-gray-500 hover:text-green-400'}`}
          >
            {form.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Display name & description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Display name</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price (PHP cents, 0 = free)</label>
            <input
              type="number" min={0}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <p className="text-xs text-primary mt-1">= {form.price === 0 ? 'Free' : formatCurrency(form.price / 100, 'PHP')}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            >
              <option value="forever">forever</option>
              <option value="month">/month</option>
              <option value="year">/year</option>
            </select>
          </div>
        </div>

        {/* Limits */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Limits (-1 = unlimited)</label>
          <div className="grid grid-cols-3 gap-2">
            {(['clients', 'projects', 'invoices'] as const).map((key) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-1 capitalize">{key}</label>
                <input
                  type="number" min={-1}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  value={form.limits[key]}
                  onChange={(e) => setForm({ ...form, limits: { ...form.limits, [key]: Number(e.target.value) } })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Features</label>
          <div className="space-y-1.5 mb-2">
            {form.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
                  value={f}
                  onChange={(e) => updateFeat(i, e.target.value)}
                />
                <button onClick={() => removeFeat(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary placeholder-gray-600"
              placeholder="Add a feature..."
              value={newFeat}
              onChange={(e) => setNewFeat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFeat()}
            />
            <button
              onClick={addFeat}
              className="px-3 py-1.5 bg-primary/20 text-primary text-xs rounded-lg hover:bg-primary/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Save */}
        {isDirty && (
          <button
            onClick={() => onSave(plan.id, form)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn:  async () => {
      const { data } = await api.get('/api/admin/plans');
      return data.data.plans as Plan[];
    },
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) =>
      api.put(`/api/admin/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast({ title: 'Plan saved', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to save plan', variant: 'error' }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Plans Manager</h1>
        <p className="text-gray-400 text-sm mt-1">Edit plan pricing, features, and limits. Changes reflect immediately on the pricing page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSave={(id, formData) => updatePlan.mutate({ id, data: formData })}
          />
        ))}
      </div>
    </div>
  );
}
