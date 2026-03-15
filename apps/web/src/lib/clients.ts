import api from '@/lib/api';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ListClientsParams,
} from '@/types/client';

export const clientsApi = {
  list: async (params?: ListClientsParams) => {
    const { data } = await api.get('/api/clients', { params });
    return data;
  },

  get: async (id: string): Promise<{ client: Client }> => {
    const { data } = await api.get(`/api/clients/${id}`);
    return data.data;
  },

  create: async (input: CreateClientInput): Promise<{ client: Client }> => {
    const { data } = await api.post('/api/clients', input);
    return data.data;
  },

  update: async (id: string, input: UpdateClientInput): Promise<{ client: Client }> => {
    const { data } = await api.put(`/api/clients/${id}`, input);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/clients/${id}`);
  },

  getProjects: async (id: string) => {
    const { data } = await api.get(`/api/clients/${id}/projects`);
    return data.data;
  },

  getInvoices: async (id: string) => {
    const { data } = await api.get(`/api/clients/${id}/invoices`);
    return data.data;
  },

  regeneratePortalToken: async (id: string) => {
    const { data } = await api.post(`/api/clients/${id}/regenerate-portal-token`);
    return data.data;
  },
};