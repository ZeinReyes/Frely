import api from '@/lib/api';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsParams,
  KanbanBoard,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
} from '@/types/project';

export const projectsApi = {
  list: async (params?: ListProjectsParams) => {
    const { data } = await api.get('/api/projects', { params });
    return data;
  },

  get: async (id: string): Promise<{ project: Project }> => {
    const { data } = await api.get(`/api/projects/${id}`);
    return data.data;
  },

  create: async (input: CreateProjectInput): Promise<{ project: Project }> => {
    const { data } = await api.post('/api/projects', input);
    return data.data;
  },

  update: async (id: string, input: UpdateProjectInput): Promise<{ project: Project }> => {
    const { data } = await api.put(`/api/projects/${id}`, input);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },

  getBoard: async (id: string): Promise<{ board: KanbanBoard }> => {
    const { data } = await api.get(`/api/projects/${id}/board`);
    return data.data;
  },
};

export const tasksApi = {
  get: async (id: string) => {
    const { data } = await api.get(`/api/tasks/${id}`);
    return data.data;
  },

  create: async (projectId: string, input: CreateTaskInput) => {
    const { data } = await api.post(`/api/projects/${projectId}/tasks`, input);
    return data.data;
  },

  update: async (id: string, input: UpdateTaskInput) => {
    const { data } = await api.put(`/api/tasks/${id}`, input);
    return data.data;
  },

  move: async (id: string, input: MoveTaskInput) => {
    const { data } = await api.patch(`/api/tasks/${id}/move`, input);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },

  getComments: async (id: string) => {
    const { data } = await api.get(`/api/tasks/${id}/comments`);
    return data.data;
  },

  createComment: async (id: string, content: string) => {
    const { data } = await api.post(`/api/tasks/${id}/comments`, { content });
    return data.data;
  },

  deleteComment: async (commentId: string) => {
    await api.delete(`/api/tasks/comments/${commentId}`);
  },
};
