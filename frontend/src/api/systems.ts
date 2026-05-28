import apiClient from './client';
import type { System, SystemPayload } from '../types';

export async function fetchSystems(): Promise<System[]> {
  const response = await apiClient.get<System[]>('/systems');
  return response.data;
}

export async function fetchSystem(id: number): Promise<System> {
  const response = await apiClient.get<System>(`/systems/${id}`);
  return response.data;
}

export async function createSystem(payload: SystemPayload): Promise<System> {
  const response = await apiClient.post<System>('/systems', payload);
  return response.data;
}

export async function updateSystem(
  id: number,
  payload: SystemPayload
): Promise<System> {
  const response = await apiClient.put<System>(`/systems/${id}`, payload);
  return response.data;
}

export async function deleteSystem(id: number): Promise<void> {
  await apiClient.delete(`/systems/${id}`);
}
