'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { milestonesApi } from '@/lib/milestones';
import { useToast } from '@/hooks/useToast';
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneStatus,
  ReorderMilestoneItem,
} from '@/types/milestone';

export const MILESTONE_KEYS = {
  all:    ['milestones'] as const,
  list:   (projectId: string) => ['milestones', 'list', projectId] as const,
  detail: (id: string)        => ['milestones', 'detail', id] as const,
};

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: MILESTONE_KEYS.list(projectId),
    queryFn:  () => milestonesApi.list(projectId),
    enabled:  !!projectId,
  });
}

export function useMilestone(id: string) {
  return useQuery({
    queryKey: MILESTONE_KEYS.detail(id),
    queryFn:  () => milestonesApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => milestonesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
      toast({ title: 'Milestone created', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to create milestone', variant: 'error' });
    },
  });
}

export function useUpdateMilestone(id: string, projectId: string) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: (input: UpdateMilestoneInput) => milestonesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.detail(id) });
      toast({ title: 'Milestone updated', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to update milestone', variant: 'error' });
    },
  });
}

export function useUpdateMilestoneStatus(projectId: string) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MilestoneStatus }) =>
      milestonesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
      toast({ title: 'Milestone status updated', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'error' });
    },
  });
}

export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: (id: string) => milestonesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
      toast({ title: 'Milestone deleted', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to delete milestone', variant: 'error' });
    },
  });
}

export function useReorderMilestones(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestones: ReorderMilestoneItem[]) =>
      milestonesApi.reorder(projectId, milestones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
    },
  });
}
