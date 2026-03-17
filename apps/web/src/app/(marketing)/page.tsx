'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Zap, Users, FolderKanban,
  Receipt, FileText, Clock, BarChart2, Bot, Globe,
  Star, Shield, Sparkles, TrendingUp, Play, Sun, Moon, Mail,
} from 'lucide-react';
import { getTheme, setTheme } from '@/lib/theme';
import api from '@/lib/api';

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Users, FolderKanban, FileText, Receipt, Clock, Bot,
  BarChart2, Globe, Zap, Shield, Star, Mail, TrendingUp, Sparkles,
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface HeroContent     { badge: string; title: string; subtitle: string; cta1: string; cta2: string; note: string }
interface StatItem        { stat: string; label: string }
interface FeatureItem     { icon: string; title: string; desc: string }
interface TestimonialItem { name: string; role: string; avatar: string; text: string }
interface CTAContent      { title: string; subtitle: string; cta1: string; cta2: string }
interface Plan {
  id: string; name: string; displayName: string; description: string;
  price: number; period: string; isPopular: boolean; isVisible: boolean; sortOrder: number;
  features: string[]; limits: { clients: number; projects: number; invoices: number };
}

interface LandingContent {
  hero:         HeroContent;
  stats:        StatItem[];
  features:     FeatureItem[];
  testimonials: TestimonialItem[];
  cta:          CTAContent;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
function useLandingContent(): LandingContent | undefined {
  const { data } = useQuery<LandingContent>({
    queryKey: ['landing-content'],
    queryFn:  async () => {
      const { data } = await api.get('/api/public/landing');
      return data.data.content as LandingContent;
    },
    staleTime: 0,
  });

  return data;
}

// ── Plans hook ────────────────────────────────────────────────────────────────
function usePlans(): Plan[] | undefined {
  const { data } = useQuery<Plan[]>({
    queryKey: ['landing-plans'],
    queryFn:  async () => {
      const { data } = await api.get('/api/public/landing');
      return data.data.plans as Plan[];
    },
    staleTime: 0,
  });

  if (!data) return undefined;
  return data.filter((p) => p.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Price display helper ───────────────────────────────────────────────────────
function formatPlanPrice(price: number, period: string): { display: string; period: string } {
  if (price === 0) return { display: 'Free', period: 'forever' };
  const php = price / 100;
  const formatted = `₱${php % 1 === 0 ? php.toLocaleString() : php.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  return { display: formatted, period: `/${period}` };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <span className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const content = useLandingContent();
  const plans   = usePlans();

  const isLoading = !content;

  useEffect(() => {
    const theme = getTheme();
    setDark(theme === 'dark');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setTheme(next);
    setDark(!dark);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans transition-colors duration-200">

      {/* ── NAV ─────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Frely</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <a href="#features"     className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing"      className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-gray-900 dark:hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary/10 border border-primary-100 dark:border-primary/20 text-primary text-xs font-semibold rounded-full mb-6 min-w-[180px] justify-center">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {isLoading ? <Skeleton className="h-3 w-32" /> : content.hero.badge}
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.08] tracking-tight mb-6 min-h-[1.08em]">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-3/4 mx-auto" />
                <Skeleton className="h-16 w-1/2 mx-auto" />
              </div>
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                {content.hero.title}
              </span>
            )}
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed min-h-[3.5rem]">
            {isLoading ? (
              <span className="flex flex-col gap-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6 mx-auto" />
              </span>
            ) : content.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-600 transition-all text-base shadow-xl shadow-primary/30 hover:-translate-y-0.5"
            >
              {isLoading ? <Skeleton className="h-4 w-24" /> : content.hero.cta1} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors text-base"
            >
              <Play className="h-4 w-4 text-primary fill-primary" />
              {isLoading ? <Skeleton className="h-4 w-28" /> : content.hero.cta2}
            </a>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 min-h-[1rem]">
            {isLoading ? <Skeleton className="h-3 w-48 mx-auto" /> : content.hero.note}
          </p>
        </div>

        {/* App mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl shadow-gray-200/80 dark:shadow-black/40">
            <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white dark:bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                app.frely.ph/dashboard
              </div>
            </div>
            <div className="bg-gray-950 flex" style={{ minHeight: 300 }}>
              <div className="w-48 bg-gray-900 border-r border-gray-800 p-4 space-y-1 shrink-0">
                <div className="flex items-center gap-2 mb-5 px-2">
                  <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                    <Zap className="h-3 w-3 text-white fill-white" />
                  </div>
                  <span className="text-sm font-bold text-white">Frely</span>
                </div>
                {['Dashboard','Clients','Projects','Invoices','Analytics'].map((item, i) => (
                  <div key={item} className={`h-8 rounded-lg flex items-center px-3 text-xs font-medium ${i === 0 ? 'bg-primary/20 text-primary' : 'text-gray-500'}`}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Dashboard</p>
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[['Total Clients','12','↑ 3 this month'],['Active Projects','8','2 due soon'],['Revenue MTD','₱48,200','↑ 12%'],['Pending','₱12,500','3 invoices']].map(([label, val, sub]) => (
                    <div key={label} className="bg-gray-900 rounded-xl p-3.5 border border-gray-800">
                      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                      <p className="text-base font-bold text-white">{val}</p>
                      <p className="text-[10px] text-primary mt-1">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider">Revenue</p>
                    <div className="flex items-end gap-1 h-16">
                      {[40,65,45,80,60,90,75].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: i === 5 ? '#6C63FF' : '#374151' }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider">Top Clients</p>
                    <div className="space-y-2">
                      {[['Little Coders','80'],['Design Co.','60'],['Tech Hub','45']].map(([name, w]) => (
                        <div key={name} className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-400 w-16 truncate">{name}</p>
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${w}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-primary/20 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── STATS ───────────────────────────── */}
      <section className="py-14 border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-24 mx-auto mb-2" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              ))
            : content.stats.map(({ stat, label }) => (
                <div key={stat}>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stat}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                </div>
              ))
          }
        </div>
      </section>

      {/* ── FEATURES ────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Everything a freelancer needs</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Stop juggling 10 different tools. Frely has everything built in — and it actually works together.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <Skeleton className="w-10 h-10 rounded-xl mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                ))
              : content.features.map(({ icon, title, desc }) => {
                  const Icon = ICON_MAP[icon] ?? Zap;
                  return (
                    <div key={title} className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-200 dark:hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-200">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────── */}
      <section id="testimonials" className="py-24 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Loved by freelancers</h2>
            <p className="text-gray-500 dark:text-gray-400">Join thousands of Filipino freelancers already using Frely.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-4 w-4 rounded" />)}
                    </div>
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4 mb-6" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <div>
                        <Skeleton className="h-3 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                ))
              : content.testimonials.map(({ name, role, avatar, text }) => (
                  <div key={name} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6">&ldquo;{text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{role}</p>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Start free. Upgrade when you need more power.</p>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${
            !plans ? 'lg:grid-cols-4' :
            plans.length === 4 ? 'lg:grid-cols-4' :
            plans.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
          }`}>
            {!plans
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-3 w-32 mb-4" />
                    <Skeleton className="h-10 w-24 mb-5" />
                    <div className="space-y-2.5 mb-6">
                      {Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
                    </div>
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))
              : plans.map((plan) => {
                  const { display: priceDisplay, period: periodDisplay } = formatPlanPrice(plan.price, plan.period);
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl flex flex-col transition-all ${
                        plan.isPopular
                          ? 'bg-primary border-2 border-primary shadow-2xl shadow-primary/25 scale-105'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-4 inset-x-0 flex justify-center">
                          <span className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-primary text-xs font-bold rounded-full shadow-lg border border-primary-100">
                            <Zap className="h-3 w-3 fill-primary" /> Most Popular
                          </span>
                        </div>
                      )}
                      <div className={`p-6 pb-4 ${plan.isPopular ? 'mt-4' : ''}`}>
                        <h3 className={`text-base font-bold mb-0.5 ${plan.isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {plan.displayName}
                        </h3>
                        <p className={`text-xs mb-4 ${plan.isPopular ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>
                          {plan.description}
                        </p>
                        <div className="flex items-baseline gap-1 mb-5">
                          <span className={`text-4xl font-extrabold ${plan.isPopular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {priceDisplay}
                          </span>
                          <span className={`text-sm ${plan.isPopular ? 'text-primary-200' : 'text-gray-400'}`}>
                            {periodDisplay}
                          </span>
                        </div>
                        <div className={`h-px mb-5 ${plan.isPopular ? 'bg-primary-400' : 'bg-gray-100 dark:bg-gray-800'}`} />
                        <ul className="space-y-2.5 mb-6 flex-1">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5">
                              <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.isPopular ? 'text-primary-200' : 'text-green-500'}`} />
                              <span className={`text-sm ${plan.isPopular ? 'text-primary-50' : 'text-gray-600 dark:text-gray-300'}`}>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="px-6 pb-6 mt-auto">
                        <Link
                          href={plan.price === 0 ? '/register' : `/register?plan=${plan.name}`}
                          className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            plan.isPopular
                              ? 'bg-white text-primary hover:bg-primary-50 shadow-lg'
                              : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
                          }`}
                        >
                          {plan.price === 0 ? 'Get started free' : `Start ${plan.displayName}`} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
            }
          </div>
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            All plans include a 14-day free trial of paid features. No credit card required.
          </p>
        </div>
      </section>

      {/* ── TRUST ───────────────────────────── */}
      <section className="py-14 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-10">
          {[
            { icon: Shield,     label: 'Secure payments via PayMongo & PayPal' },
            { icon: TrendingUp, label: 'Trusted by 1,000+ Filipino freelancers' },
            { icon: Zap,        label: 'Set up in under 5 minutes' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="py-24 px-6 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight min-h-[2.5rem]">
            {isLoading ? <Skeleton className="h-10 w-3/4 mx-auto" /> : content.cta.title}
          </h2>
          <p className="text-primary-100 mb-10 text-lg max-w-xl mx-auto min-h-[1.75rem]">
            {isLoading ? <Skeleton className="h-5 w-2/3 mx-auto" /> : content.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-primary-50 transition-colors text-base shadow-xl"
            >
              {isLoading ? <Skeleton className="h-4 w-32" /> : content.cta.cta1} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base border border-white/20"
            >
              {isLoading ? <Skeleton className="h-4 w-32" /> : content.cta.cta2}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────── */}
      <footer className="py-12 px-6 bg-gray-900 dark:bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold text-white">Frely</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              {['Features','Pricing','Privacy','Terms','Contact'].map(item => (
                <a key={item} href="#" className="hover:text-gray-300 transition-colors">{item}</a>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>© 2026 Frely. Built with ❤️ for freelancers.</p>
            <p>Secure payments by PayMongo & PayPal</p>
          </div>
        </div>
      </footer>

    </div>
  );
}