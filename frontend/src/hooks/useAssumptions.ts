import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAssumptions,
  fetchAssumption,
  createAssumption,
  updateAssumption,
  deleteAssumption,
} from '../api/assumptions';
import type { AssumptionsFilters, AssumptionCreatePayload, AssumptionUpdatePayload } from '../types';

export const assumptionKeys = {
  all: ['assumptions'] as const,
  lists: () => [...assumptionKeys.all, 'list'] as const,
  list: (filters: AssumptionsFilters) => [...assumptionKeys.lists(), filters] as const,
  details: () => [...assumptionKeys.all, 'detail'] as const,
  detail: (id: number) => [...assumptionKeys.details(), id] as const,
};

export function useAssumptions(filters: AssumptionsFilters = {}) {
  return useQuery({
    queryKey: assumptionKeys.list(filters),
    queryFn: () => fetchAssumptions(filters),
  });
}

export function useAssumption(id: number | null) {
  return useQuery({
    queryKey: assumptionKeys.detail(id!),
    queryFn: () => fetchAssumption(id!),
    enabled: Boolean(id),
  });
}

export function useCreateAssumption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssumptionCreatePayload) => createAssumption(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: assumptionKeys.lists() }),
  });
}

export function useUpdateAssumption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssumptionUpdatePayload }) =>
      updateAssumption(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: assumptionKeys.lists() });
      qc.setQueryData(assumptionKeys.detail(data.id), data);
    },
  });
}

export function useDeleteAssumption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAssumption(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: assumptionKeys.lists() }),
  });
}
