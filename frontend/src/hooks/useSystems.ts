import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  fetchSystems,
  createSystem,
  updateSystem,
  deleteSystem,
} from '../api/systems';
import type { System, SystemPayload } from '../types';

export const systemKeys = {
  all: ['systems'] as const,
  lists: () => [...systemKeys.all, 'list'] as const,
};

export function useSystems(): UseQueryResult<System[]> {
  return useQuery({
    queryKey: systemKeys.lists(),
    queryFn: fetchSystems,
  });
}

export function useCreateSystem(): UseMutationResult<
  System,
  Error,
  SystemPayload
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.lists() });
    },
  });
}

export function useUpdateSystem(): UseMutationResult<
  System,
  Error,
  { id: number; payload: SystemPayload }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateSystem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.lists() });
    },
  });
}

export function useDeleteSystem(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSystem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.lists() });
    },
  });
}
