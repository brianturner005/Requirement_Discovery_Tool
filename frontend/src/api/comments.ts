import apiClient from './client';
import type { RequirementComment } from '../types';

export async function listComments(reqId: string): Promise<RequirementComment[]> {
  const { data } = await apiClient.get(`/requirements/${reqId}/comments`);
  return data;
}

export async function createComment(reqId: string, body: string): Promise<RequirementComment> {
  const { data } = await apiClient.post(`/requirements/${reqId}/comments`, { body });
  return data;
}

export async function updateComment(commentId: number, body: string): Promise<RequirementComment> {
  const { data } = await apiClient.put(`/comments/${commentId}`, { body });
  return data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
