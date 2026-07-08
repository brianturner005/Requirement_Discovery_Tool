import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/defects';
import type { DefectCreatePayload, DefectsFilters, DefectUpdatePayload } from '../types';

const defectKeys = {
  all: ['defects'] as const,
  list: (filters: DefectsFilters) => [...defectKeys.all, 'list', filters] as const,
  detail: (id: number) => [...defectKeys.all, 'detail', id] as const,
};

export function useDefects(filters: DefectsFilters = {}) {
  return useQuery({
    queryKey: defectKeys.list(filters),
    queryFn: () => api.listDefects(filters),
  });
}

export function useDefect(id: number) {
  return useQuery({
    queryKey: defectKeys.detail(id),
    queryFn: () => api.getDefect(id),
    enabled: id > 0,
  });
}

export function useCreateDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DefectCreatePayload) => api.createDefect(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: defectKeys.all }),
  });
}

export function useUpdateDefect(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DefectUpdatePayload) => api.updateDefect(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: defectKeys.all }),
  });
}

export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteDefect(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: defectKeys.all }),
  });
}
