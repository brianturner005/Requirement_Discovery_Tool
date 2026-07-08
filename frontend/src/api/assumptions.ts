import apiClient from './client';
import type {
  Assumption,
  AssumptionsFilters,
  AssumptionCreatePayload,
  AssumptionUpdatePayload,
  PaginatedResponse,
} from '../types';

export async function fetchAssumptions(filters: AssumptionsFilters = {}): Promise<PaginatedResponse<Assumption>> {
  const { data } = await apiClient.get('/assumptions', { params: filters });
  return data;
}

export async function fetchAssumption(id: number): Promise<Assumption> {
  const { data } = await apiClient.get(`/assumptions/${id}`);
  return data;
}

export async function createAssumption(payload: AssumptionCreatePayload): Promise<Assumption> {
  const { data } = await apiClient.post('/assumptions', payload);
  return data;
}

export async function updateAssumption(id: number, payload: AssumptionUpdatePayload): Promise<Assumption> {
  const { data } = await apiClient.put(`/assumptions/${id}`, payload);
  return data;
}

export async function deleteAssumption(id: number): Promise<void> {
  await apiClient.delete(`/assumptions/${id}`);
}
