'use client';

import { getErrorMessage } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, tasksApi } from '@/lib/projects';
import { toast } from '@/hooks/useToast';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsParams,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
} from '@/types/project';

// ─────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────
export const PROJECT_KEYS = {
  all:    ['projects'] as const,
  list:   (params?: ListProjectsParams) => ['projects', 'list', params] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
  board:  (id: string) => ['projects', 'board', id] as const,
};

export const TASK_KEYS = {
  all:      ['tasks'] as const,
  detail:   (id: string) => ['tasks', 'detail', id] as const,
  comments: (id: string) => ['tasks', 'comments', id] as const,
};

// ─────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────
export function useProjects(params?: ListProjectsParams) {
  return useQuery({
    queryKey: PROJECT_KEYS.list(params),
    queryFn:  () => projectsApi.list(params),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn:  () => projectsApi.get(id),
    enabled:  !!id,
  });
}

export function useKanbanBoard(projectId: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.board(projectId),
    queryFn:  () => projectsApi.getBoard(projectId),
    enabled:  !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast({ title: 'Project created successfully', variant: 'success' });
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        title:       'Failed to create project',
        description: error.response?.data?.error?.message || 'Something went wrong',
        variant:     'error',
      });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
      toast({ title: 'Project updated', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to update project', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
      toast({ title: 'Project deleted', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to delete project', description: getErrorMessage(error), variant: 'error' }),
  });
}

// ─────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────
export function useTask(id: string) {
  return useQuery({
    queryKey: TASK_KEYS.detail(id),
    queryFn:  () => tasksApi.get(id),
    enabled:  !!id,
  });
}

export function useTaskComments(id: string) {
  return useQuery({
    queryKey: TASK_KEYS.comments(id),
    queryFn:  () => tasksApi.getComments(id),
    enabled:  !!id,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.board(projectId) });
      toast({ title: 'Task created', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to create task', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTaskInput) => tasksApi.update(taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.board(projectId) });
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.detail(taskId) });
      toast({ title: 'Task updated', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to update task', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: MoveTaskInput }) =>
      tasksApi.move(taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.board(projectId) });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.board(projectId) });
      toast({ title: 'Task deleted', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to delete task', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => tasksApi.createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.comments(taskId) });
    },
  });
}
