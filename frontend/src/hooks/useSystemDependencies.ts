import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/systemDependencies';
import type { SystemDependencyCreatePayload, SystemDependencyUpdatePayload } from '../types';

const depKeys = {
  all: ['system-dependencies'] as const,
  list: (systemId?: number) => [...depKeys.all, 'list', systemId] as const,
};

export function useSystemDependencies(systemId?: number) {
  return useQuery({
    queryKey: depKeys.list(systemId),
    queryFn: () => api.listSystemDependencies(systemId),
  });
}

export function useCreateSystemDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SystemDependencyCreatePayload) => api.createSystemDependency(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: depKeys.all }),
  });
}

export function useUpdateSystemDependency(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SystemDependencyUpdatePayload) => api.updateSystemDependency(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: depKeys.all }),
  });
}

export function useDeleteSystemDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSystemDependency(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: depKeys.all }),
  });
}
