'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/clients';
import { useToast } from '@/hooks/useToast';
import type { CreateClientInput, UpdateClientInput, ListClientsParams } from '@/types/client';

export const CLIENT_KEYS = {
  all:      ['clients'] as const,
  list:     (params?: ListClientsParams) => ['clients', 'list', params] as const,
  detail:   (id: string) => ['clients', 'detail', id] as const,
  projects: (id: string) => ['clients', 'projects', id] as const,
  invoices: (id: string) => ['clients', 'invoices', id] as const,
};

export function useClients(params?: ListClientsParams) {
  return useQuery({
    queryKey: CLIENT_KEYS.list(params),
    queryFn:  () => clientsApi.list(params),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id),
    queryFn:  () => clientsApi.get(id),
    enabled:  !!id,
  });
}

export function useClientProjects(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.projects(id),
    queryFn:  () => clientsApi.getProjects(id),
    enabled:  !!id,
  });
}

export function useClientInvoices(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.invoices(id),
    queryFn:  () => clientsApi.getInvoices(id),
    enabled:  !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: (input: CreateClientInput) => clientsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast({ title: 'Client created successfully', variant: 'success' });
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        title:       'Failed to create client',
        description: error.response?.data?.error?.message || 'Something went wrong',
        variant:     'error',
      });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: (input: UpdateClientInput) => clientsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) });
      toast({ title: 'Client updated successfully', variant: 'success' });
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        title:       'Failed to update client',
        description: error.response?.data?.error?.message || 'Something went wrong',
        variant:     'error',
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  return useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
      toast({ title: 'Client deleted', variant: 'success' });
    },
    onError: () => {
      toast({ title: 'Failed to delete client', variant: 'error' });
    },
  });
}