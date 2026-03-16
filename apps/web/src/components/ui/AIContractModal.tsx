'use client';

import { useState } from 'react';
import { Sparkles, X, Check, RefreshCw, Copy } from 'lucide-react';
import { aiApi } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';

const QUICK_PROMPTS = [
  'Late payment fee clause',
  'Intellectual property ownership clause',
  'Revision and change request policy',
  'Project cancellation and kill fee',
  'Confidentiality and NDA clause',
  'Force majeure clause',
];

interface Props {
  onAccept: (clauses: string) => void;
  onClose:  () => void;
}

export function AIContractModal({ onAccept, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<string | null>(null);
  const [error,       setError]       = useState('');
  const [copied,      setCopied]      = useState(false);

  const generate = async (desc?: string) => {
    const text = desc || description;
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.generateClauses(text);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">AI Contract Clauses</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">What clauses do you need?</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. I need a late payment clause and an IP ownership clause"
                  className="input resize-none text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Quick prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setDescription(p); generate(p); }}
                      disabled={loading}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary text-gray-600 rounded-full border border-gray-200 hover:border-primary transition-colors disabled:opacity-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Clauses generated!</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          {!result ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={() => generate()}
                disabled={!description.trim() || loading}
                loading={loading}
              >
                {loading ? 'Generating...' : <><Sparkles className="h-4 w-4" /> Generate clauses</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setResult(null)} className="flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
              <Button variant="secondary" onClick={copy} className="flex items-center gap-1.5">
                {copied ? <><Check className="h-4 w-4 text-green-500" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
              </Button>
              <Button onClick={() => { onAccept(result); onClose(); }}>
                <Check className="h-4 w-4" /> Insert into contract
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
