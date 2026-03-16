'use client';

import { getErrorMessage } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proposalsApi, contractsApi } from '@/lib/proposals';
import { toast } from '@/hooks/useToast';
import type { CreateProposalInput, CreateContractInput } from '@/types/proposal';

// ─────────────────────────────────────────
// PROPOSALS
// ─────────────────────────────────────────
export const PROPOSAL_KEYS = {
  all:    ['proposals'] as const,
  list:   (clientId?: string) => ['proposals', 'list', clientId] as const,
  detail: (id: string)        => ['proposals', 'detail', id] as const,
};

export function useProposals(clientId?: string) {
  return useQuery({
    queryKey: PROPOSAL_KEYS.list(clientId),
    queryFn:  () => proposalsApi.list(clientId),
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: PROPOSAL_KEYS.detail(id),
    queryFn:  () => proposalsApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProposalInput) => proposalsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_KEYS.all });
      toast({ title: 'Proposal created', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to create proposal', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateProposal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateProposalInput>) => proposalsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROPOSAL_KEYS.detail(id) });
      toast({ title: 'Proposal updated', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to update proposal', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useSendProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proposalsApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_KEYS.all });
      toast({ title: 'Proposal marked as sent', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to send proposal', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proposalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPOSAL_KEYS.all });
      toast({ title: 'Proposal deleted', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to delete proposal', description: getErrorMessage(error), variant: 'error' }),
  });
}

// ─────────────────────────────────────────
// CONTRACTS
// ─────────────────────────────────────────
export const CONTRACT_KEYS = {
  all:    ['contracts'] as const,
  list:   (clientId?: string) => ['contracts', 'list', clientId] as const,
  detail: (id: string)        => ['contracts', 'detail', id] as const,
  token:  (token: string)     => ['contracts', 'token', token] as const,
};

export function useContracts(clientId?: string) {
  return useQuery({
    queryKey: CONTRACT_KEYS.list(clientId),
    queryFn:  () => contractsApi.list(clientId),
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: CONTRACT_KEYS.detail(id),
    queryFn:  () => contractsApi.get(id),
    enabled:  !!id,
  });
}

export function useContractByToken(token: string) {
  return useQuery({
    queryKey: CONTRACT_KEYS.token(token),
    queryFn:  () => contractsApi.getByToken(token),
    enabled:  !!token,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContractInput) => contractsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.all });
      toast({ title: 'Contract created', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to create contract', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useUpdateContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateContractInput>) => contractsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.detail(id) });
      toast({ title: 'Contract updated', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to update contract', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useSendContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractsApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.all });
      toast({ title: 'Contract marked as sent', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to send contract', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useSignContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, signatureName }: { token: string; signatureName: string }) =>
      contractsApi.sign(token, signatureName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.all });
      toast({ title: 'Contract signed!', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to sign contract', description: getErrorMessage(error), variant: 'error' }),
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTRACT_KEYS.all });
      toast({ title: 'Contract deleted', variant: 'success' });
    },
    onError: (error: unknown) => toast({ title: 'Failed to delete contract', description: getErrorMessage(error), variant: 'error' }),
  });
}
