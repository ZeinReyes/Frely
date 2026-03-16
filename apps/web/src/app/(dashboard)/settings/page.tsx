'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  User, Palette, CreditCard, Save,
  Eye, EyeOff, ExternalLink, Check,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';

type Tab = 'profile' | 'branding' | 'payments';

const TABS = [
  { id: 'profile'  as Tab, label: 'Profile',  icon: User },
  { id: 'branding' as Tab, label: 'Branding', icon: Palette },
  { id: 'payments' as Tab, label: 'Payments', icon: CreditCard },
];

const TIMEZONES = [
  'UTC', 'Asia/Manila', 'Asia/Singapore', 'Asia/Tokyo',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Australia/Sydney',
];

// ─────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────
function ProfileTab() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const { data } = useQuery({
    queryKey: ['settings', 'profile'],
    queryFn:  async () => {
      const { data } = await api.get('/api/settings/profile');
      return data.data.profile;
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: { name: '', fullName: '', timezone: 'UTC' },
  });

  useEffect(() => {
    if (data) reset({ name: data.name, fullName: data.fullName || '', timezone: data.timezone || 'UTC' });
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (input: Record<string, string>) => api.put('/api/settings/profile', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'profile'] });
      toast({ title: 'Profile updated', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to update profile', variant: 'error' }),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-lg">
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-foreground">Personal Information</h2>

        <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-dark-border">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary text-xl font-bold">
            {data?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-dark-foreground">{data?.name}</p>
            <p className="text-xs text-gray-500 dark:text-dark-muted-fg">{data?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary rounded-full font-medium">
              {data?.plan} plan
            </span>
          </div>
        </div>

        <Input label="Display name" {...register('name')} />
        <Input label="Full name" placeholder="Used on invoices and proposals" {...register('fullName')} />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted-fg">Timezone</label>
          <select className="input" {...register('timezone')}>
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" loading={isSubmitting || mutation.isPending} disabled={!isDirty}>
        <Save className="h-4 w-4" /> Save changes
      </Button>
    </form>
  );
}

// ─────────────────────────────────────────
// BRANDING TAB
// ─────────────────────────────────────────
function BrandingTab() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const { data } = useQuery({
    queryKey: ['settings', 'branding'],
    queryFn:  async () => {
      const { data } = await api.get('/api/settings/branding');
      return data.data.branding;
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, isDirty } } = useForm({
    defaultValues: { companyName: '', primaryColor: '#6C63FF', logoUrl: '' },
  });

  // Single source of truth — watch the RHF field value
  const primaryColor = watch('primaryColor');

  useEffect(() => {
    if (data) {
      reset({
        companyName:  data.companyName  || '',
        primaryColor: data.primaryColor || '#6C63FF',
        logoUrl:      data.logoUrl      || '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (input: Record<string, string>) => api.put('/api/settings/branding', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'branding'] });
      toast({ title: 'Branding updated', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to update branding', variant: 'error' }),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-lg">
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-foreground">Brand Identity</h2>
        <p className="text-xs text-gray-500 dark:text-dark-muted-fg">
          Your branding appears on invoices, proposals, and contracts sent to clients.
        </p>

        <Input
          label="Company name"
          placeholder="e.g. Zein Benedict Design Studio"
          {...register('companyName')}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted-fg">Brand color</label>
          <p className="text-xs text-gray-400 dark:text-dark-subtle">Enter a full 6-digit hex code e.g. #6C63FF</p>
          <div className="flex items-center gap-3">
            {/* ✅ Color picker: NOT registered — uses onChange to call setValue */}
            <input
              type="color"
              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-dark-border cursor-pointer p-0.5"
              value={primaryColor}
              onChange={(e) => setValue('primaryColor', e.target.value, { shouldDirty: true })}
            />
            {/* ✅ Text input: the only registered field */}
            <input
              type="text"
              className="input flex-1 font-mono text-sm"
              placeholder="#6C63FF"
              maxLength={7}
              {...register('primaryColor')}
            />
            {/* Live preview swatch */}
            <div
              className="w-10 h-10 rounded-lg border border-gray-200 dark:border-dark-border shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        </div>

        <Input
          label="Logo URL"
          placeholder="https://your-logo.com/logo.png"
          {...register('logoUrl')}
        />
      </div>

      {/* Preview */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-foreground mb-3">Preview</h3>
        <div className="border border-gray-200 dark:border-dark-border rounded-lg p-4 bg-gray-50 dark:bg-dark-elevated">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-dark-border">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {watch('companyName')?.charAt(0)?.toUpperCase() || 'F'}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: primaryColor }}>
                {watch('companyName') || 'Your Company'}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-muted-fg">Invoice #INV-2026-0001</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 dark:bg-dark-muted rounded w-3/4" />
            <div className="h-2 bg-gray-200 dark:bg-dark-muted rounded w-1/2" />
          </div>
          <div className="mt-3 pt-3 border-t-2" style={{ borderColor: primaryColor }}>
            <p className="text-xs font-bold" style={{ color: primaryColor }}>Total: $1,200.00</p>
          </div>
        </div>
      </div>

      <Button type="submit" loading={isSubmitting || mutation.isPending} disabled={!isDirty}>
        <Save className="h-4 w-4" /> Save branding
      </Button>
    </form>
  );
}

// ─────────────────────────────────────────
// PAYMENTS TAB
// ─────────────────────────────────────────
function PaymentsTab() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  const [showPayPalSecret,   setShowPayPalSecret]   = useState(false);
  const [showPaymongoSecret, setShowPaymongoSecret] = useState(false);
  const [savedPayPal,        setSavedPayPal]        = useState(false);
  const [savedPaymongo,      setSavedPaymongo]      = useState(false);

  const { data } = useQuery({
    queryKey: ['settings', 'payments'],
    queryFn:  async () => {
      const { data } = await api.get('/api/settings/payments');
      return data.data.settings;
    },
  });

  const paypalForm = useForm({
    defaultValues: { paypalClientId: '', paypalClientSecret: '', paypalMode: 'sandbox', paypalEmail: '' },
  });

  const paymongoForm = useForm({
    defaultValues: { paymongoPublicKey: '', paymongoSecretKey: '' },
  });

  useEffect(() => {
    if (data) {
      paypalForm.reset({
        paypalClientId:     data.paypalClientId     || '',
        paypalClientSecret: data.paypalClientSecret || '',
        paypalMode:         data.paypalMode         || 'sandbox',
        paypalEmail:        data.paypalEmail        || '',
      });
      paymongoForm.reset({
        paymongoPublicKey: data.paymongoPublicKey || '',
        paymongoSecretKey: data.paymongoSecretKey || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (input: Record<string, string>) => api.put('/api/settings/payments', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'payments'] }),
    onError:   () => toast({ title: 'Failed to save', variant: 'error' }),
  });

  const savePayPal = async (d: Record<string, string>) => {
    await mutation.mutateAsync(d);
    setSavedPayPal(true);
    setTimeout(() => setSavedPayPal(false), 2000);
  };

  const savePaymongo = async (d: Record<string, string>) => {
    await mutation.mutateAsync(d);
    setSavedPaymongo(true);
    setTimeout(() => setSavedPaymongo(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* PayPal */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-foreground">PayPal</h2>
          <a
            href="https://developer.paypal.com/dashboard/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Get credentials <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-muted-fg mb-4">
          For international clients. Create an app at developer.paypal.com to get your Client ID and Secret.
        </p>
        <form onSubmit={paypalForm.handleSubmit(savePayPal)} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted-fg">Mode</label>
            <select className="input" {...paypalForm.register('paypalMode')}>
              <option value="sandbox">Sandbox (testing)</option>
              <option value="live">Live (production)</option>
            </select>
          </div>
          <Input label="PayPal email" placeholder="your@paypal.com" {...paypalForm.register('paypalEmail')} />
          <Input label="Client ID" placeholder="AaBbCc..." {...paypalForm.register('paypalClientId')} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted-fg">Client Secret</label>
            <div className="relative">
              <input
                type={showPayPalSecret ? 'text' : 'password'}
                className="input pr-10"
                placeholder="EeFfGg..."
                {...paypalForm.register('paypalClientSecret')}
              />
              <button
                type="button"
                onClick={() => setShowPayPalSecret(!showPayPalSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPayPalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" size="sm" loading={mutation.isPending}>
            {savedPayPal ? <><Check className="h-4 w-4 text-green-500" /> Saved!</> : <><Save className="h-4 w-4" /> Save PayPal</>}
          </Button>
        </form>
      </div>

      {/* PayMongo */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-dark-foreground">PayMongo</h2>
          <a
            href="https://dashboard.paymongo.com/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Get credentials <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-muted-fg mb-4">
          For Philippine clients. Accepts GCash, Maya, and credit cards. Get keys from your PayMongo dashboard.
        </p>
        <form onSubmit={paymongoForm.handleSubmit(savePaymongo)} className="space-y-3">
          <Input label="Public key" placeholder="pk_live_..." {...paymongoForm.register('paymongoPublicKey')} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-muted-fg">Secret key</label>
            <div className="relative">
              <input
                type={showPaymongoSecret ? 'text' : 'password'}
                className="input pr-10"
                placeholder="sk_live_..."
                {...paymongoForm.register('paymongoSecretKey')}
              />
              <button
                type="button"
                onClick={() => setShowPaymongoSecret(!showPaymongoSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPaymongoSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" size="sm" loading={mutation.isPending}>
            {savedPaymongo ? <><Check className="h-4 w-4 text-green-500" /> Saved!</> : <><Save className="h-4 w-4" /> Save PayMongo</>}
          </Button>
        </form>
      </div>

      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> Payment credentials are stored securely per account.
          Each freelancer using Frely connects their own payment accounts.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, branding, and payment integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-dark-muted rounded-xl p-1 w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-white dark:bg-dark-elevated text-gray-900 dark:text-dark-foreground shadow-sm'
                : 'text-gray-500 dark:text-dark-muted-fg hover:text-gray-700 dark:hover:text-dark-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile'  && <ProfileTab />}
      {activeTab === 'branding' && <BrandingTab />}
      {activeTab === 'payments' && <PaymentsTab />}
    </div>
  );
}