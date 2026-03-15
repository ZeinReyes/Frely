import api from '@/lib/api';
import type {
  Proposal,
  Contract,
  CreateProposalInput,
  CreateContractInput,
} from '@/types/proposal';

export const proposalsApi = {
  list: async (clientId?: string): Promise<{ proposals: Proposal[] }> => {
    const { data } = await api.get('/api/proposals', { params: clientId ? { clientId } : undefined });
    return data.data;
  },

  get: async (id: string): Promise<{ proposal: Proposal }> => {
    const { data } = await api.get(`/api/proposals/${id}`);
    return data.data;
  },

  create: async (input: CreateProposalInput): Promise<{ proposal: Proposal }> => {
    const { data } = await api.post('/api/proposals', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateProposalInput>): Promise<{ proposal: Proposal }> => {
    const { data } = await api.put(`/api/proposals/${id}`, input);
    return data.data;
  },

  send: async (id: string): Promise<{ proposal: Proposal }> => {
    const { data } = await api.post(`/api/proposals/${id}/send`);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/proposals/${id}`);
  },

  getPDFUrl: (id: string): string => `/api/proposals/${id}/pdf`,
};

export const contractsApi = {
  list: async (clientId?: string): Promise<{ contracts: Contract[] }> => {
    const { data } = await api.get('/api/contracts', { params: clientId ? { clientId } : undefined });
    return data.data;
  },

  get: async (id: string): Promise<{ contract: Contract }> => {
    const { data } = await api.get(`/api/contracts/${id}`);
    return data.data;
  },

  getByToken: async (token: string): Promise<{ contract: Contract }> => {
    const { data } = await api.get(`/api/sign/${token}`);
    return data.data;
  },

  create: async (input: CreateContractInput): Promise<{ contract: Contract }> => {
    const { data } = await api.post('/api/contracts', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateContractInput>): Promise<{ contract: Contract }> => {
    const { data } = await api.put(`/api/contracts/${id}`, input);
    return data.data;
  },

  send: async (id: string): Promise<{ contract: Contract }> => {
    const { data } = await api.post(`/api/contracts/${id}/send`);
    return data.data;
  },

  sign: async (token: string, signatureName: string): Promise<{ contract: Contract }> => {
    const { data } = await api.post(`/api/sign/${token}`, {
      signatureName,
      signatureDate: new Date().toISOString(),
    });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/contracts/${id}`);
  },

  getPDFUrl: (id: string): string => `/api/contracts/${id}/pdf`,
};
