import apiClient from './client';
import type { PaginatedResponse, TestCase, TestCaseCreatePayload, TestCasesFilters, TestCaseUpdatePayload } from '../types';

export async function listTestCases(filters: TestCasesFilters = {}): Promise<PaginatedResponse<TestCase>> {
  const { data } = await apiClient.get('/test-cases', { params: filters });
  return data;
}

export async function getTestCase(id: number): Promise<TestCase> {
  const { data } = await apiClient.get(`/test-cases/${id}`);
  return data;
}

export async function createTestCase(payload: TestCaseCreatePayload): Promise<TestCase> {
  const { data } = await apiClient.post('/test-cases', payload);
  return data;
}

export async function updateTestCase(id: number, payload: TestCaseUpdatePayload): Promise<TestCase> {
  const { data } = await apiClient.put(`/test-cases/${id}`, payload);
  return data;
}

export async function deleteTestCase(id: number): Promise<void> {
  await apiClient.delete(`/test-cases/${id}`);
}
