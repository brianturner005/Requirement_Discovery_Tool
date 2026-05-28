import apiClient from './client';
import type {
  Requirement,
  RequirementsFilters,
  RequirementCreatePayload,
  RequirementUpdatePayload,
  PaginatedResponse,
  Evidence,
} from '../types';

export async function fetchRequirements(
  filters: RequirementsFilters = {}
): Promise<PaginatedResponse<Requirement>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );
  const response = await apiClient.get<PaginatedResponse<Requirement>>('/requirements', { params });
  return response.data;
}

export async function fetchRequirement(reqId: string): Promise<Requirement> {
  const response = await apiClient.get<Requirement>(`/requirements/${reqId}`);
  return response.data;
}

export async function createRequirement(
  payload: RequirementCreatePayload
): Promise<Requirement> {
  const response = await apiClient.post<Requirement>('/requirements', payload);
  return response.data;
}

export async function updateRequirement(
  reqId: string,
  payload: RequirementUpdatePayload
): Promise<Requirement> {
  const response = await apiClient.put<Requirement>(`/requirements/${reqId}`, payload);
  return response.data;
}

export async function deleteRequirement(reqId: string): Promise<void> {
  await apiClient.delete(`/requirements/${reqId}`);
}

export async function transitionStatus(
  reqId: string,
  status: string
): Promise<Requirement> {
  const response = await apiClient.patch<Requirement>(
    `/requirements/${reqId}/status`,
    { status }
  );
  return response.data;
}

export async function addRelation(
  reqId: string,
  targetReqId: string
): Promise<void> {
  await apiClient.post(`/requirements/${reqId}/relations/${targetReqId}`);
}

export async function removeRelation(
  reqId: string,
  targetReqId: string
): Promise<void> {
  await apiClient.delete(`/requirements/${reqId}/relations/${targetReqId}`);
}

export async function fetchEvidence(reqId: string): Promise<Evidence[]> {
  const response = await apiClient.get<Evidence[]>(
    `/requirements/${reqId}/evidence`
  );
  return response.data;
}

export async function uploadEvidence(
  reqId: string,
  file: File
): Promise<Evidence> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<Evidence>(
    `/requirements/${reqId}/evidence`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
}

export async function deleteEvidence(evidenceId: number): Promise<void> {
  await apiClient.delete(`/evidence/${evidenceId}`);
}

export function getEvidenceDownloadUrl(evidenceId: number): string {
  return `/api/v1/evidence/${evidenceId}/download`;
}

export async function fetchTags(): Promise<{ id: number; name: string }[]> {
  const response = await apiClient.get<{ id: number; name: string }[]>('/tags');
  return response.data;
}
