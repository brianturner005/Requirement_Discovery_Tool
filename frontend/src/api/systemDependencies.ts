import apiClient from './client';
import type { SystemDependency, SystemDependencyCreatePayload, SystemDependencyUpdatePayload } from '../types';

export async function listSystemDependencies(systemId?: number): Promise<SystemDependency[]> {
  const { data } = await apiClient.get('/system-dependencies', { params: systemId ? { system_id: systemId } : {} });
  return data;
}

export async function createSystemDependency(payload: SystemDependencyCreatePayload): Promise<SystemDependency> {
  const { data } = await apiClient.post('/system-dependencies', payload);
  return data;
}

export async function updateSystemDependency(id: number, payload: SystemDependencyUpdatePayload): Promise<SystemDependency> {
  const { data } = await apiClient.put(`/system-dependencies/${id}`, payload);
  return data;
}

export async function deleteSystemDependency(id: number): Promise<void> {
  await apiClient.delete(`/system-dependencies/${id}`);
}
