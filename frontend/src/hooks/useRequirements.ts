import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  fetchRequirements,
  fetchRequirement,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  transitionStatus,
  addRelation,
  removeRelation,
} from '../api/requirements';
import type {
  Requirement,
  RequirementsFilters,
  RequirementCreatePayload,
  RequirementUpdatePayload,
  PaginatedResponse,
} from '../types';

export const requirementKeys = {
  all: ['requirements'] as const,
  lists: () => [...requirementKeys.all, 'list'] as const,
  list: (filters: RequirementsFilters) =>
    [...requirementKeys.lists(), filters] as const,
  details: () => [...requirementKeys.all, 'detail'] as const,
  detail: (reqId: string) => [...requirementKeys.details(), reqId] as const,
};

export function useRequirements(
  filters: RequirementsFilters = {}
): UseQueryResult<PaginatedResponse<Requirement>> {
  return useQuery({
    queryKey: requirementKeys.list(filters),
    queryFn: () => fetchRequirements(filters),
  });
}

export function useRequirement(
  reqId: string
): UseQueryResult<Requirement> {
  return useQuery({
    queryKey: requirementKeys.detail(reqId),
    queryFn: () => fetchRequirement(reqId),
    enabled: !!reqId,
  });
}

export function useCreateRequirement(): UseMutationResult<
  Requirement,
  Error,
  RequirementCreatePayload
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requirementKeys.lists() });
    },
  });
}

export function useUpdateRequirement(): UseMutationResult<
  Requirement,
  Error,
  { reqId: string; payload: RequirementUpdatePayload }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reqId, payload }) => updateRequirement(reqId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: requirementKeys.lists() });
      queryClient.setQueryData(requirementKeys.detail(data.req_id), data);
    },
  });
}

export function useDeleteRequirement(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requirementKeys.lists() });
    },
  });
}

export function useTransitionStatus(): UseMutationResult<
  Requirement,
  Error,
  { reqId: string; status: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reqId, status }) => transitionStatus(reqId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: requirementKeys.lists() });
      queryClient.setQueryData(requirementKeys.detail(data.req_id), data);
    },
  });
}

export function useAddRelation(): UseMutationResult<
  void,
  Error,
  { reqId: string; targetReqId: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reqId, targetReqId }) => addRelation(reqId, targetReqId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: requirementKeys.detail(variables.reqId),
      });
    },
  });
}

export function useRemoveRelation(): UseMutationResult<
  void,
  Error,
  { reqId: string; targetReqId: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reqId, targetReqId }) => removeRelation(reqId, targetReqId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: requirementKeys.detail(variables.reqId),
      });
    },
  });
}
