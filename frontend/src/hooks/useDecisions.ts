import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDecisions,
  fetchDecision,
  createDecision,
  updateDecision,
  deleteDecision,
} from '../api/decisions';
import type { DecisionsFilters, DecisionCreatePayload, DecisionUpdatePayload } from '../types';

export const decisionKeys = {
  all: ['decisions'] as const,
  lists: () => [...decisionKeys.all, 'list'] as const,
  list: (filters: DecisionsFilters) => [...decisionKeys.lists(), filters] as const,
  details: () => [...decisionKeys.all, 'detail'] as const,
  detail: (id: number) => [...decisionKeys.details(), id] as const,
};

export function useDecisions(filters: DecisionsFilters = {}) {
  return useQuery({
    queryKey: decisionKeys.list(filters),
    queryFn: () => fetchDecisions(filters),
  });
}

export function useDecision(id: number | null) {
  return useQuery({
    queryKey: decisionKeys.detail(id!),
    queryFn: () => fetchDecision(id!),
    enabled: Boolean(id),
  });
}

export function useCreateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DecisionCreatePayload) => createDecision(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: decisionKeys.lists() }),
  });
}

export function useUpdateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DecisionUpdatePayload }) =>
      updateDecision(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: decisionKeys.lists() });
      qc.setQueryData(decisionKeys.detail(data.id), data);
    },
  });
}

export function useDeleteDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDecision(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: decisionKeys.lists() }),
  });
}
