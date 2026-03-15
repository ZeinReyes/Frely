'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/lib/files';
import { useToast } from '@/hooks/useToast';
import type { UpdateFileInput } from '@/types/file';

export const FILE_KEYS = {
  all:     ['files'] as const,
  list:    (params: { projectId?: string; clientId?: string }) => ['files', 'list', params] as const,
};

export function useFiles(params: { projectId?: string; clientId?: string }) {
  return useQuery({
    queryKey: FILE_KEYS.list(params),
    queryFn:  () => filesApi.list(params),
    enabled:  !!(params.projectId || params.clientId),
  });
}

export function useUploadFile(params: { projectId?: string; clientId?: string }) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: ({ file, isClientVisible }: { file: File; isClientVisible?: boolean }) =>
      filesApi.upload(file, { ...params, isClientVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILE_KEYS.list(params) });
      toast({ title: 'File uploaded', variant: 'success' });
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        title:       'Upload failed',
        description: error.response?.data?.error?.message || 'Something went wrong',
        variant:     'error',
      });
    },
  });
}

export function useUpdateFile(params: { projectId?: string; clientId?: string }) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFileInput }) =>
      filesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILE_KEYS.list(params) });
      toast({ title: 'File updated', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to update file', variant: 'error' });
    },
  });
}

export function useDeleteFile(params: { projectId?: string; clientId?: string }) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILE_KEYS.list(params) });
      toast({ title: 'File deleted', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to delete file', variant: 'error' });
    },
  });
}
