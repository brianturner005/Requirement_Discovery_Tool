import apiClient from './client';
import type {
  LegacyBehavior,
  LegacyBehaviorsFilters,
  LegacyBehaviorCreatePayload,
  LegacyBehaviorUpdatePayload,
  PaginatedResponse,
} from '../types';

export async function fetchLegacyBehaviors(filters: LegacyBehaviorsFilters = {}): Promise<PaginatedResponse<LegacyBehavior>> {
  const { data } = await apiClient.get('/legacy-behaviors', { params: filters });
  return data;
}

export async function fetchLegacyBehavior(id: number): Promise<LegacyBehavior> {
  const { data } = await apiClient.get(`/legacy-behaviors/${id}`);
  return data;
}

export async function createLegacyBehavior(payload: LegacyBehaviorCreatePayload): Promise<LegacyBehavior> {
  const { data } = await apiClient.post('/legacy-behaviors', payload);
  return data;
}

export async function updateLegacyBehavior(id: number, payload: LegacyBehaviorUpdatePayload): Promise<LegacyBehavior> {
  const { data } = await apiClient.put(`/legacy-behaviors/${id}`, payload);
  return data;
}

export async function deleteLegacyBehavior(id: number): Promise<void> {
  await apiClient.delete(`/legacy-behaviors/${id}`);
}
