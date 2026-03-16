'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { aiApi } from '@/hooks/useAI';

interface Props {
  projectId: string;
}

export function AIProjectSummary({ projectId }: Props) {
  const [loading,   setLoading]   = useState(false);
  const [summary,   setSummary]   = useState<string | null>(null);
  const [error,     setError]     = useState('');
  const [expanded,  setExpanded]  = useState(true);
  const [copied,    setCopied]    = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await aiApi.generateProjectSummary(projectId);
      setSummary(data);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!summary && !loading && !error) {
    return (
      <button
        onClick={generate}
        className="flex items-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-primary-50 to-purple-50 hover:from-primary-100 hover:to-purple-100 border border-primary-200 rounded-xl text-sm font-medium text-primary transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Generate AI project summary
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
        <p className="text-sm text-primary">Writing summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={generate} className="text-xs text-red-700 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="border border-primary-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">AI Project Summary</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copy} className="text-primary hover:text-primary/80 transition-colors">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={generate} className="text-primary hover:text-primary/80 transition-colors" title="Regenerate">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="text-primary hover:text-primary/80 transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {expanded && summary && (
        <div className="px-4 py-3 bg-white">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </div>
  );
}
