'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Zap, ArrowLeft, ExternalLink, Shield, Clock, Users } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

const PLANS = [
  {
    name:    'Starter',
    price:   'Free',
    period:  'forever',
    popular: false,
    color:   'default',
    description: 'Perfect for getting started',
    features: [
      '3 clients',
      '3 projects',
      '5 invoices / month',
      'Proposals & contracts',
      'AI features',
      'Client portal',
      'Time tracking',
      'Basic analytics',
    ],
  },
  {
    name:    'Solo',
    price:   '₱299',
    period:  '/ month',
    popular: false,
    color:   'blue',
    description: 'For growing freelancers',
    features: [
      '15 clients',
      '15 projects',
      '30 invoices / month',
      'Everything in Starter',
      'Payment reminders',
      'Priority support',
    ],
  },
  {
    name:    'Pro',
    price:   '₱699',
    period:  '/ month',
    popular: true,
    color:   'primary',
    description: 'For serious freelancers',
    features: [
      'Unlimited clients',
      'Unlimited projects',
      'Unlimited invoices',
      'Everything in Solo',
      'White-labeling',
      'Custom brand colors',
      '3 team members 🔜',
    ],
  },
  {
    name:    'Agency',
    price:   '₱1,499',
    period:  '/ month',
    popular: false,
    color:   'purple',
    description: 'For teams and agencies',
    features: [
      'Everything in Pro',
      'Unlimited everything',
      '10 team members 🔜',
      'Dedicated support',
      'Custom domain 🔜',
      'API access 🔜',
    ],
  },
];

const PLAN_ORDER = ['STARTER', 'SOLO', 'PRO', 'AGENCY'];

const FAQ = [
  {
    q: 'Can I upgrade or downgrade anytime?',
    a: 'You can upgrade anytime and your new limits take effect immediately. To downgrade, please contact support.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept GCash, Maya, and credit/debit cards via PayMongo for Philippine users, and PayPal for international payments.',
  },
  {
    q: 'What happens when I hit my plan limits?',
    a: "You'll see a warning when approaching your limits. You won't lose any data — you just need to upgrade to add more.",
  },
  {
    q: 'When are team members coming?',
    a: "Team member support is actively being developed for Pro and Agency plans. You'll be notified when it launches.",
  },
];

export default function UpgradePage() {
  const router        = useRouter();
  const { toast }     = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: profileData } = useQuery({
    queryKey: ['settings', 'profile'],
    queryFn:  async () => {
      const { data } = await api.get('/api/settings/profile');
      return data.data.profile;
    },
  });

  const currentPlan = profileData?.plan || 'STARTER';
  const currentIdx  = PLAN_ORDER.indexOf(currentPlan.toUpperCase());

  const handleUpgrade = async (planName: string) => {
    const planUpper = planName.toUpperCase();
    const targetIdx = PLAN_ORDER.indexOf(planUpper);
    if (targetIdx <= currentIdx) return;

    setLoading(planName);
    try {
      toast({ title: `Upgrading to ${planName}...`, variant: 'success' });
      setTimeout(() => {
        toast({ title: 'Payment integration coming soon!', variant: 'success' });
        setLoading(null);
      }, 1500);
    } catch {
      toast({ title: 'Failed to start upgrade', variant: 'error' });
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Plans & Billing</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Upgrade your plan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            You're on the{' '}
            <span className="font-semibold text-primary">{currentPlan}</span> plan.
            {currentPlan === 'STARTER' && ' Upgrade to unlock more power.'}
          </p>
        </div>

        {/* Usage card */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary-50 dark:bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              Your current usage
            </h3>
            <div className="space-y-4">
              <UsageBar label="Clients"  planName={currentPlan} limitKey="clients"  icon={Users} />
              <UsageBar label="Projects" planName={currentPlan} limitKey="projects" icon={Zap} />
              <UsageBar label="Invoices" planName={currentPlan} limitKey="invoices" icon={Clock} />
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PLANS.map((plan) => {
            const isCurrent  = currentPlan.toUpperCase() === plan.name.toUpperCase();
            const targetIdx  = PLAN_ORDER.indexOf(plan.name.toUpperCase());
            const isDowngrade = targetIdx < currentIdx;
            const isLoading  = loading === plan.name;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl flex flex-col transition-all duration-200 ${
                  plan.popular
                    ? 'bg-primary border-2 border-primary shadow-2xl shadow-primary/20 scale-105'
                    : isCurrent
                    ? 'bg-white dark:bg-gray-900 border-2 border-green-400 dark:border-green-500 shadow-lg'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-primary text-xs font-bold rounded-full shadow-lg border border-primary-100">
                      <Zap className="h-3 w-3 fill-primary" /> Most Popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                      <CheckCircle2 className="h-3 w-3" /> Current Plan
                    </span>
                  </div>
                )}

                <div className={`p-6 pb-4 ${plan.popular ? 'mt-4' : isCurrent ? 'mt-4' : ''}`}>
                  {/* Plan name & description */}
                  <div className="mb-4">
                    <h3 className={`text-base font-bold mb-0.5 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs ${plan.popular ? 'text-primary-100' : 'text-gray-400 dark:text-gray-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.popular ? 'text-primary-200' : 'text-gray-400'}`}>
                      {plan.period}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className={`h-px mb-5 ${plan.popular ? 'bg-primary-400' : 'bg-gray-100 dark:bg-gray-800'}`} />

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? 'text-primary-200' : 'text-green-500'}`} />
                        <span className={`text-sm ${plan.popular ? 'text-primary-50' : 'text-gray-600 dark:text-gray-300'}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 mt-auto">
                  {isCurrent ? (
                    <div className={`w-full py-2.5 text-center text-sm font-semibold rounded-xl ${
                      plan.popular
                        ? 'bg-primary-400 text-white'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    }`}>
                      ✓ Current plan
                    </div>
                  ) : isDowngrade ? (
                    <div className="w-full py-2.5 text-center text-xs font-medium rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700">
                      Contact support to downgrade
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={isLoading}
                      className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        plan.popular
                          ? 'bg-white text-primary hover:bg-primary-50 shadow-lg'
                          : 'bg-primary text-white hover:bg-primary-600 shadow-md shadow-primary/20'
                      } disabled:opacity-70`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Upgrade <ExternalLink className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-16 py-8 border-y border-gray-200 dark:border-gray-800">
          {[
            { icon: Shield, label: 'Secure payments via PayMongo & PayPal' },
            { icon: Clock,  label: 'Cancel or upgrade anytime' },
            { icon: Zap,    label: 'Limits apply immediately after upgrade' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{q}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// USAGE BAR
// ─────────────────────────────────────────
function UsageBar({ label, planName, limitKey, icon: Icon }: {
  label:    string;
  planName: string;
  limitKey: 'clients' | 'projects' | 'invoices';
  icon:     React.ElementType;
}) {
  const LIMITS: Record<string, Record<string, number>> = {
    STARTER: { clients: 3,  projects: 3,  invoices: 5  },
    SOLO:    { clients: 15, projects: 15, invoices: 30 },
    PRO:     { clients: -1, projects: -1, invoices: -1 },
    AGENCY:  { clients: -1, projects: -1, invoices: -1 },
  };

  const { data } = useQuery({
    queryKey: ['analytics', 'month'],
    queryFn:  async () => {
      const { data } = await api.get('/api/analytics?period=month');
      return data.data;
    },
  });

  const limit   = LIMITS[planName?.toUpperCase() || 'STARTER']?.[limitKey] ?? 3;
  const current = limitKey === 'clients'
    ? data?.summary?.totalClients  || 0
    : limitKey === 'projects'
    ? data?.summary?.totalProjects || 0
    : data?.summary?.totalInvoices || 0;

  const isUnlimited = limit === -1;
  const pct         = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && pct >= 80;
  const isAtLimit   = !isUnlimited && pct >= 100;

  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
          <span className={`text-sm font-semibold ${
            isAtLimit   ? 'text-red-500'   :
            isNearLimit ? 'text-amber-500' :
            'text-gray-700 dark:text-gray-300'
          }`}>
            {isUnlimited ? '∞ Unlimited' : `${current} / ${limit}`}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAtLimit   ? 'bg-red-500'   :
                isNearLimit ? 'bg-amber-500' :
                'bg-primary'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}