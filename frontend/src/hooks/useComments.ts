import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/comments';

const commentKeys = {
  all: (reqId: string) => ['comments', reqId] as const,
};

export function useComments(reqId: string) {
  return useQuery({
    queryKey: commentKeys.all(reqId),
    queryFn: () => api.listComments(reqId),
    enabled: !!reqId,
  });
}

export function useCreateComment(reqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.createComment(reqId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.all(reqId) }),
  });
}

export function useUpdateComment(reqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) => api.updateComment(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.all(reqId) }),
  });
}

export function useDeleteComment(reqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.all(reqId) }),
  });
}
