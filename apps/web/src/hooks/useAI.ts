'use client';

import { useState } from 'react';
import api from '@/lib/api';

// ─────────────────────────────────────────
// API
// ─────────────────────────────────────────
export const aiApi = {
  generateProposal: async (data: {
    projectDescription: string;
    clientName?: string;
    currency?: string;
  }) => {
    const { data: res } = await api.post('/api/ai/proposal', data);
    return res.data.proposal;
  },

  generateClauses: async (description: string) => {
    const { data: res } = await api.post('/api/ai/contract-clauses', { description });
    return res.data.clauses as string;
  },

  generateEmail: async (data: {
    scenario:       string;
    clientName?:    string;
    context?:       string;
    invoiceNumber?: string;
    amount?:        string;
    projectName?:   string;
  }) => {
    const { data: res } = await api.post('/api/ai/email', data);
    return res.data.email as { subject: string; body: string };
  },

  generateProjectSummary: async (projectId: string) => {
    const { data: res } = await api.get(`/api/ai/project/${projectId}/summary`);
    return res.data.summary as string;
  },

  generateInvoiceItems: async (data: { projectDescription: string; currency?: string }) => {
    const { data: res } = await api.post('/api/ai/invoice-items', data);
    return res.data.lineItems as { description: string; quantity: number; unitPrice: number; amount: number }[];
  },
};

// ─────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────
export function useAIGenerate<T>() {
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState<T | null>(null);
  const [error,   setError]     = useState<string | null>(null);

  const generate = async (fn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fn();
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };

  return { loading, result, error, generate, reset };
}
