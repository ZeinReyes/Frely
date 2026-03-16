'use client';

import { useState } from 'react';
import { Sparkles, X, Check, RefreshCw, Copy } from 'lucide-react';
import { aiApi } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';

type EmailScenario = 'follow_up_invoice' | 'project_update' | 'request_feedback' | 'project_completion' | 'payment_overdue' | 'custom';

const SCENARIOS: { value: EmailScenario; label: string; description: string }[] = [
  { value: 'follow_up_invoice',   label: '📧 Follow up on invoice',    description: 'Remind client about unpaid invoice' },
  { value: 'payment_overdue',     label: '⚠️ Overdue payment',         description: 'Firm but polite overdue reminder' },
  { value: 'project_update',      label: '📊 Project update',          description: 'Share progress with client' },
  { value: 'project_completion',  label: '🎉 Project completed',       description: 'Announce project is done' },
  { value: 'request_feedback',    label: '⭐ Request feedback',         description: 'Ask for testimonial or review' },
  { value: 'custom',              label: '✍️ Custom email',             description: 'Describe what you need' },
];

interface Props {
  clientName?:    string;
  invoiceNumber?: string;
  amount?:        string;
  projectName?:   string;
  onClose:        () => void;
}

export function AIEmailModal({ clientName, invoiceNumber, amount, projectName, onClose }: Props) {
  const [scenario,  setScenario]  = useState<EmailScenario | ''>('');
  const [context,   setContext]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<{ subject: string; body: string } | null>(null);
  const [error,     setError]     = useState('');
  const [copied,    setCopied]    = useState(false);

  const generate = async () => {
    if (!scenario) return;
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.generateEmail({
        scenario,
        clientName,
        context,
        invoiceNumber,
        amount,
        projectName,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">AI Email Writer</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!result ? (
            <>
              {/* Scenario picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What kind of email?</label>
                <div className="grid grid-cols-2 gap-2">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScenario(s.value)}
                      className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                        scenario === s.value
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-gray-200 hover:border-primary hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <p className="font-medium">{s.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional context <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any specific details to include..."
                  className="input resize-none text-sm"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Email generated!</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</label>
                <p className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{result.subject}</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Body</label>
                <div className="text-sm text-gray-700 bg-gray-50 px-3 py-3 rounded-lg whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {result.body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          {!result ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={generate}
                disabled={!scenario || loading}
                loading={loading}
              >
                {loading ? 'Writing...' : <><Sparkles className="h-4 w-4" /> Write email</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setResult(null)} className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4" /> Redo
              </Button>
              <Button variant="secondary" onClick={copyEmail} className="flex items-center gap-1.5">
                {copied ? <><Check className="h-4 w-4 text-green-500" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
