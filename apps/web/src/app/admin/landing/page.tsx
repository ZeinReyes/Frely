'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Trash2, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toast } from '@/hooks/useToast';

type SectionKey = 'hero' | 'stats' | 'features' | 'testimonials' | 'cta';

const SECTIONS: { key: SectionKey; label: string; desc: string }[] = [
  { key: 'hero',         label: 'Hero Section',    desc: 'Main headline, subtitle, and CTA buttons' },
  { key: 'stats',        label: 'Stats Bar',        desc: 'The 3 stat numbers below the hero' },
  { key: 'features',     label: 'Features Grid',   desc: 'The 8 feature cards' },
  { key: 'testimonials', label: 'Testimonials',    desc: 'Customer reviews' },
  { key: 'cta',          label: 'CTA Section',     desc: 'Bottom call-to-action section' },
];

// ─────────────────────────────────────────
// HERO EDITOR
// ─────────────────────────────────────────
function HeroEditor({ value, onSave }: { value: Record<string, string>; onSave: (v: unknown) => void }) {
  const [form, setForm] = useState(value);
  const isDirty = JSON.stringify(form) !== JSON.stringify(value);

  useEffect(() => setForm(value), [value]);

  return (
    <div className="space-y-3">
      {[
        { key: 'badge',    label: 'Badge text' },
        { key: 'title',    label: 'Main title' },
        { key: 'subtitle', label: 'Subtitle', multi: true },
        { key: 'cta1',     label: 'Primary CTA button' },
        { key: 'cta2',     label: 'Secondary CTA button' },
        { key: 'note',     label: 'Note below CTAs' },
      ].map(({ key, label, multi }) => (
        <div key={key}>
          <label className="block text-xs text-gray-500 mb-1">{label}</label>
          {multi ? (
            <textarea
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary resize-none"
              value={form[key] || ''}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ) : (
            <input
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              value={form[key] || ''}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          )}
        </div>
      ))}
      {isDirty && (
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
          <Save className="h-4 w-4" /> Save hero
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// STATS EDITOR
// ─────────────────────────────────────────
function StatsEditor({ value, onSave }: { value: { stat: string; label: string }[]; onSave: (v: unknown) => void }) {
  const [form, setForm] = useState(value);
  const isDirty = JSON.stringify(form) !== JSON.stringify(value);
  useEffect(() => setForm(value), [value]);

  return (
    <div className="space-y-3">
      {form.map((item, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-gray-800 rounded-xl">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stat</label>
            <input
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              value={item.stat}
              onChange={(e) => { const f = [...form]; f[i] = { ...f[i], stat: e.target.value }; setForm(f); }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label</label>
            <input
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              value={item.label}
              onChange={(e) => { const f = [...form]; f[i] = { ...f[i], label: e.target.value }; setForm(f); }}
            />
          </div>
        </div>
      ))}
      {isDirty && (
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
          <Save className="h-4 w-4" /> Save stats
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// FEATURES EDITOR
// ─────────────────────────────────────────
function FeaturesEditor({ value, onSave }: { value: { icon: string; title: string; desc: string }[]; onSave: (v: unknown) => void }) {
  const [form, setForm] = useState(value);
  const isDirty = JSON.stringify(form) !== JSON.stringify(value);
  useEffect(() => setForm(value), [value]);

  const ICONS = ['Users', 'FolderKanban', 'FileText', 'Receipt', 'Clock', 'Bot', 'BarChart2', 'Globe', 'Zap', 'Shield', 'Star', 'Mail'];

  return (
    <div className="space-y-3">
      {form.map((item, i) => (
        <div key={i} className="p-4 bg-gray-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Feature {i + 1}</span>
            <button onClick={() => setForm(form.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Icon</label>
              <select
                className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                value={item.icon}
                onChange={(e) => { const f = [...form]; f[i] = { ...f[i], icon: e.target.value }; setForm(f); }}
              >
                {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Title</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                value={item.title}
                onChange={(e) => { const f = [...form]; f[i] = { ...f[i], title: e.target.value }; setForm(f); }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
              value={item.desc}
              onChange={(e) => { const f = [...form]; f[i] = { ...f[i], desc: e.target.value }; setForm(f); }}
            />
          </div>
        </div>
      ))}
      <button
        onClick={() => setForm([...form, { icon: 'Zap', title: 'New Feature', desc: 'Feature description' }])}
        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-700 text-gray-500 hover:text-primary hover:border-primary text-sm rounded-xl transition-colors"
      >
        <Plus className="h-4 w-4" /> Add feature
      </button>
      {isDirty && (
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
          <Save className="h-4 w-4" /> Save features
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// TESTIMONIALS EDITOR
// ─────────────────────────────────────────
function TestimonialsEditor({ value, onSave }: { value: { name: string; role: string; avatar: string; text: string }[]; onSave: (v: unknown) => void }) {
  const [form, setForm] = useState(value);
  const isDirty = JSON.stringify(form) !== JSON.stringify(value);
  useEffect(() => setForm(value), [value]);

  return (
    <div className="space-y-3">
      {form.map((item, i) => (
        <div key={i} className="p-4 bg-gray-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Testimonial {i + 1}</span>
            <button onClick={() => setForm(form.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                value={item.name} onChange={(e) => { const f = [...form]; f[i] = { ...f[i], name: e.target.value }; setForm(f); }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <input className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                value={item.role} onChange={(e) => { const f = [...form]; f[i] = { ...f[i], role: e.target.value }; setForm(f); }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Avatar initials</label>
              <input className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                value={item.avatar} onChange={(e) => { const f = [...form]; f[i] = { ...f[i], avatar: e.target.value }; setForm(f); }} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote</label>
            <textarea rows={2} className="w-full bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary resize-none"
              value={item.text} onChange={(e) => { const f = [...form]; f[i] = { ...f[i], text: e.target.value }; setForm(f); }} />
          </div>
        </div>
      ))}
      <button
        onClick={() => setForm([...form, { name: 'New User', role: 'Freelancer', avatar: 'NU', text: 'Great product!' }])}
        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-700 text-gray-500 hover:text-primary hover:border-primary text-sm rounded-xl transition-colors"
      >
        <Plus className="h-4 w-4" /> Add testimonial
      </button>
      {isDirty && (
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
          <Save className="h-4 w-4" /> Save testimonials
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// CTA EDITOR
// ─────────────────────────────────────────
function CTAEditor({ value, onSave }: { value: Record<string, string>; onSave: (v: unknown) => void }) {
  const [form, setForm] = useState(value);
  const isDirty = JSON.stringify(form) !== JSON.stringify(value);
  useEffect(() => setForm(value), [value]);

  return (
    <div className="space-y-3">
      {[
        { key: 'title',    label: 'Title' },
        { key: 'subtitle', label: 'Subtitle' },
        { key: 'cta1',     label: 'Primary CTA' },
        { key: 'cta2',     label: 'Secondary CTA' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="block text-xs text-gray-500 mb-1">{label}</label>
          <input
            className="w-full bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            value={form[key] || ''}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
      ))}
      {isDirty && (
        <button onClick={() => onSave(form)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
          <Save className="h-4 w-4" /> Save CTA
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────
export default function AdminLandingPage() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'landing'],
    queryFn:  async () => {
      const { data } = await api.get('/api/admin/landing');
      return data.data.content as Record<string, unknown>;
    },
  });

  const updateSection = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      api.put(`/api/admin/landing/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'landing'] });
      toast({ title: 'Section saved! Changes are live on the landing page.', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to save', variant: 'error' }),
  });

  const section = data?.[activeSection];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Landing Page Editor</h1>
          <p className="text-gray-400 text-sm mt-1">Changes are live immediately on the public landing page.</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl hover:bg-gray-700 transition-colors"
        >
          <Eye className="h-4 w-4" /> Preview landing page
        </a>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Section nav */}
        <div className="space-y-1">
          {SECTIONS.map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                activeSection === key
                  ? 'bg-primary/20 border border-primary/30 text-primary'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`}
            >
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs opacity-60 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="col-span-3 bg-gray-900 rounded-2xl border border-gray-800 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeSection === 'hero'         && section && <HeroEditor         value={section as Record<string, string>}                                    onSave={(v) => updateSection.mutate({ key: 'hero', value: v })} />}
              {activeSection === 'stats'        && section && <StatsEditor        value={section as { stat: string; label: string }[]}                         onSave={(v) => updateSection.mutate({ key: 'stats', value: v })} />}
              {activeSection === 'features'     && section && <FeaturesEditor     value={section as { icon: string; title: string; desc: string }[]}            onSave={(v) => updateSection.mutate({ key: 'features', value: v })} />}
              {activeSection === 'testimonials' && section && <TestimonialsEditor value={section as { name: string; role: string; avatar: string; text: string }[]} onSave={(v) => updateSection.mutate({ key: 'testimonials', value: v })} />}
              {activeSection === 'cta'          && section && <CTAEditor          value={section as Record<string, string>}                                    onSave={(v) => updateSection.mutate({ key: 'cta', value: v })} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
