import apiClient from './client';
import type { Defect, DefectCreatePayload, DefectsFilters, DefectUpdatePayload, PaginatedResponse } from '../types';

export async function listDefects(filters: DefectsFilters = {}): Promise<PaginatedResponse<Defect>> {
  const { data } = await apiClient.get('/defects', { params: filters });
  return data;
}

export async function getDefect(id: number): Promise<Defect> {
  const { data } = await apiClient.get(`/defects/${id}`);
  return data;
}

export async function createDefect(payload: DefectCreatePayload): Promise<Defect> {
  const { data } = await apiClient.post('/defects', payload);
  return data;
}

export async function updateDefect(id: number, payload: DefectUpdatePayload): Promise<Defect> {
  const { data } = await apiClient.put(`/defects/${id}`, payload);
  return data;
}

export async function deleteDefect(id: number): Promise<void> {
  await apiClient.delete(`/defects/${id}`);
}
