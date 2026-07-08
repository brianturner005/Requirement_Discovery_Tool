import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLegacyBehaviors,
  fetchLegacyBehavior,
  createLegacyBehavior,
  updateLegacyBehavior,
  deleteLegacyBehavior,
} from '../api/legacyBehaviors';
import type { LegacyBehaviorsFilters, LegacyBehaviorCreatePayload, LegacyBehaviorUpdatePayload } from '../types';

export const legacyBehaviorKeys = {
  all: ['legacyBehaviors'] as const,
  lists: () => [...legacyBehaviorKeys.all, 'list'] as const,
  list: (filters: LegacyBehaviorsFilters) => [...legacyBehaviorKeys.lists(), filters] as const,
  details: () => [...legacyBehaviorKeys.all, 'detail'] as const,
  detail: (id: number) => [...legacyBehaviorKeys.details(), id] as const,
};

export function useLegacyBehaviors(filters: LegacyBehaviorsFilters = {}) {
  return useQuery({
    queryKey: legacyBehaviorKeys.list(filters),
    queryFn: () => fetchLegacyBehaviors(filters),
  });
}

export function useLegacyBehavior(id: number | null) {
  return useQuery({
    queryKey: legacyBehaviorKeys.detail(id!),
    queryFn: () => fetchLegacyBehavior(id!),
    enabled: Boolean(id),
  });
}

export function useCreateLegacyBehavior() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LegacyBehaviorCreatePayload) => createLegacyBehavior(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: legacyBehaviorKeys.lists() }),
  });
}

export function useUpdateLegacyBehavior() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LegacyBehaviorUpdatePayload }) =>
      updateLegacyBehavior(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: legacyBehaviorKeys.lists() });
      qc.setQueryData(legacyBehaviorKeys.detail(data.id), data);
    },
  });
}

export function useDeleteLegacyBehavior() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLegacyBehavior(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: legacyBehaviorKeys.lists() }),
  });
}
