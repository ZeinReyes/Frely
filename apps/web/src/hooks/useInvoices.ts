import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import type { Invoice, InvoiceStats, CreateInvoiceInput } from '@/types/invoice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─────────────────────────────────────────
// API
// ─────────────────────────────────────────
export const invoicesApi = {
  list: async (filters?: { clientId?: string; status?: string; projectId?: string }) => {
    const { data } = await api.get('/api/invoices', { params: filters });
    return data.data as { invoices: Invoice[] };
  },

  stats: async () => {
    const { data } = await api.get('/api/invoices/stats');
    return data.data as { stats: InvoiceStats };
  },

  get: async (id: string) => {
    const { data } = await api.get(`/api/invoices/${id}`);
    return data.data as { invoice: Invoice };
  },

  create: async (input: CreateInvoiceInput) => {
    const { data } = await api.post('/api/invoices', input);
    return data.data as { invoice: Invoice };
  },

  update: async (id: string, input: Partial<CreateInvoiceInput>) => {
    const { data } = await api.put(`/api/invoices/${id}`, input);
    return data.data as { invoice: Invoice };
  },

  send: async (id: string) => {
    const { data } = await api.post(`/api/invoices/${id}/send`);
    return data.data as { invoice: Invoice };
  },

  sendPayPal: async (id: string) => {
    const { data } = await api.post(`/api/invoices/${id}/send-paypal`);
    return data.data as { invoice: Invoice };
  },

  markPaid: async (id: string, paidAt?: string) => {
    const { data } = await api.post(`/api/invoices/${id}/mark-paid`, { paidAt });
    return data.data as { invoice: Invoice };
  },

  delete: async (id: string) => {
    await api.delete(`/api/invoices/${id}`);
  },

  getPDFUrl: (id: string) => `${API_URL}/api/invoices/${id}/pdf`,
};

// ─────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────
export const INVOICE_KEYS = {
  all:    ['invoices'] as const,
  list:   (f?: object) => ['invoices', 'list', f] as const,
  detail: (id: string) => ['invoices', 'detail', id] as const,
  stats:  ()           => ['invoices', 'stats'] as const,
};

// ─────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────
export function useInvoices(filters?: { clientId?: string; status?: string; projectId?: string }) {
  return useQuery({
    queryKey: INVOICE_KEYS.list(filters),
    queryFn:  () => invoicesApi.list(filters),
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: INVOICE_KEYS.stats(),
    queryFn:  () => invoicesApi.stats(),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: INVOICE_KEYS.detail(id),
    queryFn:  () => invoicesApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => invoicesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast({ title: 'Invoice created', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to create invoice', variant: 'error' }),
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast({ title: 'Invoice marked as sent', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to send invoice', variant: 'error' }),
  });
}

export function useSendInvoicePayPal() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.sendPayPal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast({ title: 'Invoice sent via PayPal!', variant: 'success' });
    },
    onError: (err: Error) => toast({
      title: err.message.includes('credentials')
        ? 'PayPal not configured — add credentials to .env'
        : 'Failed to send via PayPal',
      variant: 'error',
    }),
  });
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  return useMutation({
    mutationFn: ({ id, paidAt }: { id: string; paidAt?: string }) => invoicesApi.markPaid(id, paidAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast({ title: 'Invoice marked as paid!', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to mark as paid', variant: 'error' }),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all });
      toast({ title: 'Invoice deleted', variant: 'success' });
    },
    onError: () => toast({ title: 'Failed to delete invoice', variant: 'error' }),
  });
}
