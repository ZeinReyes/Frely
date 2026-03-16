'use client';

import { getErrorMessage } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '@/lib/timeEntries';
import { toast } from '@/hooks/useToast';
import type {
  StartTimerInput,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  ListTimeEntriesParams,
} from '@/types/timeEntry';

export const TIME_KEYS = {
  all:     ['time-entries'] as const,
  list:    (params?: ListTimeEntriesParams) => ['time-entries', 'list', params] as const,
  active:  ['time-entries', 'active'] as const,
  summary: (projectId: string) => ['time-entries', 'summary', projectId] as const,
};

export function useTimeEntries(params?: ListTimeEntriesParams) {
  return useQuery({
    queryKey: TIME_KEYS.list(params),
    queryFn:  () => timeEntriesApi.list(params),
  });
}

export function useActiveTimer() {
  return useQuery({
    queryKey:        TIME_KEYS.active,
    queryFn:         () => timeEntriesApi.getActive(),
    refetchInterval: 1000, // poll every second to keep elapsed time fresh
  });
}

export function useTimeSummary(projectId: string) {
  return useQuery({
    queryKey: TIME_KEYS.summary(projectId),
    queryFn:  () => timeEntriesApi.getSummary(projectId),
    enabled:  !!projectId,
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StartTimerInput) => timeEntriesApi.start(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_KEYS.active });
      queryClient.invalidateQueries({ queryKey: TIME_KEYS.all });
      toast({ title: 'Timer started', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to start timer', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => timeEntriesApi.stop(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_KEYS.active });
      queryClient.invalidateQueries({ queryKey: TIME_KEYS.all });
      toast({ title: 'Timer stopped', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to stop timer', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTimeEntryInput) => timeEntriesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_KEYS.all });
      toast({ title: 'Time entry added', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to add time entry', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateTimeEntry(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTimeEntryInput) => timeEntriesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_KEYS.all });
      toast({ title: 'Time entry updated', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to update time entry', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_KEYS.all });
      toast({ title: 'Time entry deleted', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to delete time entry', description: getErrorMessage(error), variant: 'error' }),
  });
}
