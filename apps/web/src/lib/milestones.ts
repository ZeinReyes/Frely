import api from '@/lib/api';
import type {
  Milestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneStatus,
  ReorderMilestoneItem,
} from '@/types/milestone';

export const milestonesApi = {
  list: async (projectId: string): Promise<{ milestones: Milestone[] }> => {
    const { data } = await api.get(`/api/projects/${projectId}/milestones`);
    return data.data;
  },

  get: async (id: string): Promise<{ milestone: Milestone }> => {
    const { data } = await api.get(`/api/milestones/${id}`);
    return data.data;
  },

  create: async (input: CreateMilestoneInput): Promise<{ milestone: Milestone }> => {
    const { data } = await api.post(`/api/projects/${input.projectId}/milestones`, input);
    return data.data;
  },

  update: async (id: string, input: UpdateMilestoneInput): Promise<{ milestone: Milestone }> => {
    const { data } = await api.put(`/api/milestones/${id}`, input);
    return data.data;
  },

  updateStatus: async (id: string, status: MilestoneStatus): Promise<{ milestone: Milestone }> => {
    const { data } = await api.patch(`/api/milestones/${id}/status`, { status });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/milestones/${id}`);
  },

  reorder: async (projectId: string, milestones: ReorderMilestoneItem[]) => {
    const { data } = await api.post(`/api/projects/${projectId}/milestones/reorder`, { milestones });
    return data.data;
  },
};
