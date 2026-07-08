import apiClient from './client';
import type {
  Decision,
  DecisionsFilters,
  DecisionCreatePayload,
  DecisionUpdatePayload,
  PaginatedResponse,
} from '../types';

export async function fetchDecisions(filters: DecisionsFilters = {}): Promise<PaginatedResponse<Decision>> {
  const { data } = await apiClient.get('/decisions', { params: filters });
  return data;
}

export async function fetchDecision(id: number): Promise<Decision> {
  const { data } = await apiClient.get(`/decisions/${id}`);
  return data;
}

export async function createDecision(payload: DecisionCreatePayload): Promise<Decision> {
  const { data } = await apiClient.post('/decisions', payload);
  return data;
}

export async function updateDecision(id: number, payload: DecisionUpdatePayload): Promise<Decision> {
  const { data } = await apiClient.put(`/decisions/${id}`, payload);
  return data;
}

export async function deleteDecision(id: number): Promise<void> {
  await apiClient.delete(`/decisions/${id}`);
}
