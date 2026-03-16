'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2, Check, RefreshCw } from 'lucide-react';
import { aiApi } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';

interface ProposalAIResult {
  title:        string;
  introduction: string;
  scope:        string;
  terms:        string;
  lineItems:    { description: string; quantity: number; unitPrice: number; amount: number }[];
  notes:        string;
}

interface Props {
  clientName?: string;
  currency?:   string;
  onAccept:    (result: ProposalAIResult) => void;
  onClose:     () => void;
}

export function AIProposalModal({ clientName, currency = 'USD', onAccept, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<ProposalAIResult | null>(null);
  const [error,       setError]       = useState('');

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.generateProposal({ projectDescription: description, clientName, currency });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">AI Proposal Generator</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Describe the project
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Build a 5-page website for a restaurant. Includes homepage, menu, about, contact, and gallery. 3-week timeline."
              className="input resize-none text-sm"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">The more detail you give, the better the proposal.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Result preview */}
          {result && (
            <div className="space-y-3 border border-primary-200 rounded-xl p-4 bg-primary-50/30">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Proposal generated!</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title</p>
                <p className="text-sm text-gray-900 font-medium">{result.title}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Introduction</p>
                <p className="text-sm text-gray-700 line-clamp-3">{result.introduction}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Line Items ({result.lineItems.length})</p>
                <div className="space-y-1">
                  {result.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-medium text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.amount)}</span>
                    </div>
                  ))}
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
                disabled={!description.trim() || loading}
                loading={loading}
              >
                {loading ? 'Generating...' : <><Sparkles className="h-4 w-4" /> Generate</>}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => { setResult(null); }}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
              <Button className="flex-1" onClick={() => { onAccept(result); onClose(); }}>
                <Check className="h-4 w-4" /> Use this proposal
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
