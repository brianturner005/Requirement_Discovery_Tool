import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/integrations';

const KEYS = {
  status: ['integrations', 'status'] as const,
  linearTeams: ['integrations', 'linear', 'teams'] as const,
};

export function useIntegrationStatus() {
  return useQuery({
    queryKey: KEYS.status,
    queryFn: api.fetchIntegrationStatus,
    staleTime: 30_000,
  });
}

export function useLinearTeams() {
  return useQuery({
    queryKey: KEYS.linearTeams,
    queryFn: api.fetchLinearTeams,
  });
}

export function useConfigureJira() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.configureJira,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.status }),
  });
}

export function useConfigureLinear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.configureLinear,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.status }),
  });
}

export function usePushToJira(reqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.pushToJira(reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements', 'detail', reqId] }),
  });
}

export function usePushToLinear(reqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.pushToLinear(reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements', 'detail', reqId] }),
  });
}
