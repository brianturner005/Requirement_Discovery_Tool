import apiClient from './client';
import type { RequirementVersion } from '../types';

export async function listVersions(reqId: string): Promise<RequirementVersion[]> {
  const { data } = await apiClient.get(`/requirements/${reqId}/versions`);
  return data;
}
