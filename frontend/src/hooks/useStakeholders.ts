import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  fetchStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
} from '../api/stakeholders';
import type { Stakeholder, StakeholderPayload } from '../types';

export const stakeholderKeys = {
  all: ['stakeholders'] as const,
  lists: () => [...stakeholderKeys.all, 'list'] as const,
};

export function useStakeholders(): UseQueryResult<Stakeholder[]> {
  return useQuery({
    queryKey: stakeholderKeys.lists(),
    queryFn: fetchStakeholders,
  });
}

export function useCreateStakeholder(): UseMutationResult<
  Stakeholder,
  Error,
  StakeholderPayload
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStakeholder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stakeholderKeys.lists() });
    },
  });
}

export function useUpdateStakeholder(): UseMutationResult<
  Stakeholder,
  Error,
  { id: number; payload: StakeholderPayload }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateStakeholder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stakeholderKeys.lists() });
    },
  });
}

export function useDeleteStakeholder(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStakeholder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stakeholderKeys.lists() });
    },
  });
}
