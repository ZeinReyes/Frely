import api from '@/lib/api';
import type {
  TimeEntry,
  StartTimerInput,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  ListTimeEntriesParams,
} from '@/types/timeEntry';

export const timeEntriesApi = {
  list: async (params?: ListTimeEntriesParams) => {
    const { data } = await api.get('/api/time-entries', { params });
    return data;
  },

  getActive: async (): Promise<{ entry: TimeEntry | null }> => {
    const { data } = await api.get('/api/time-entries/active');
    return data.data;
  },

  start: async (input: StartTimerInput): Promise<{ entry: TimeEntry }> => {
    const { data } = await api.post('/api/time-entries/start', input);
    return data.data;
  },

  stop: async (): Promise<{ entry: TimeEntry }> => {
    const { data } = await api.post('/api/time-entries/stop');
    return data.data;
  },

  create: async (input: CreateTimeEntryInput): Promise<{ entry: TimeEntry }> => {
    const { data } = await api.post('/api/time-entries', input);
    return data.data;
  },

  update: async (id: string, input: UpdateTimeEntryInput): Promise<{ entry: TimeEntry }> => {
    const { data } = await api.put(`/api/time-entries/${id}`, input);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/time-entries/${id}`);
  },

  getSummary: async (projectId: string) => {
    const { data } = await api.get(`/api/time-entries/summary/${projectId}`);
    return data.data;
  },
};
