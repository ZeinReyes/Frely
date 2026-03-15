import api from '@/lib/api';
import type { VyrnFile, UpdateFileInput } from '@/types/file';

export const filesApi = {
  list: async (params: { projectId?: string; clientId?: string }): Promise<{ files: VyrnFile[] }> => {
    const { data } = await api.get('/api/files', { params });
    return data.data;
  },

  upload: async (
    file: File,
    options: { projectId?: string; clientId?: string; isClientVisible?: boolean }
  ): Promise<{ file: VyrnFile }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.projectId)      formData.append('projectId', options.projectId);
    if (options.clientId)       formData.append('clientId', options.clientId);
    if (options.isClientVisible !== undefined) {
      formData.append('isClientVisible', String(options.isClientVisible));
    }

    const { data } = await api.post('/api/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  update: async (id: string, input: UpdateFileInput): Promise<{ file: VyrnFile }> => {
    const { data } = await api.put(`/api/files/${id}`, input);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/files/${id}`);
  },
};
