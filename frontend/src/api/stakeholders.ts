import apiClient from './client';
import type { Stakeholder, StakeholderPayload } from '../types';

export async function fetchStakeholders(): Promise<Stakeholder[]> {
  const response = await apiClient.get<Stakeholder[]>('/stakeholders');
  return response.data;
}

export async function fetchStakeholder(id: number): Promise<Stakeholder> {
  const response = await apiClient.get<Stakeholder>(`/stakeholders/${id}`);
  return response.data;
}

export async function createStakeholder(
  payload: StakeholderPayload
): Promise<Stakeholder> {
  const response = await apiClient.post<Stakeholder>('/stakeholders', payload);
  return response.data;
}

export async function updateStakeholder(
  id: number,
  payload: StakeholderPayload
): Promise<Stakeholder> {
  const response = await apiClient.put<Stakeholder>(
    `/stakeholders/${id}`,
    payload
  );
  return response.data;
}

export async function deleteStakeholder(id: number): Promise<void> {
  await apiClient.delete(`/stakeholders/${id}`);
}
