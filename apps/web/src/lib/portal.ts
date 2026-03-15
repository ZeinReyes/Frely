import api from '@/lib/api';

export const portalApi = {
  getClient: async (token: string) => {
    const { data } = await api.get(`/api/portal/${token}`);
    return data.data;
  },

  getProjects: async (token: string) => {
    const { data } = await api.get(`/api/portal/${token}/projects`);
    return data.data;
  },

  getProject: async (token: string, projectId: string) => {
    const { data } = await api.get(`/api/portal/${token}/projects/${projectId}`);
    return data.data;
  },

  approveMilestone: async (token: string, milestoneId: string) => {
    const { data } = await api.post(`/api/portal/${token}/milestones/${milestoneId}/approve`);
    return data.data;
  },

  addComment: async (token: string, taskId: string, content: string) => {
    const { data } = await api.post(`/api/portal/${token}/tasks/${taskId}/comments`, { content });
    return data.data;
  },

  getFiles: async (token: string, projectId?: string) => {
    const { data } = await api.get(`/api/portal/${token}/files`, {
      params: projectId ? { projectId } : undefined,
    });
    return data.data;
  },
};
