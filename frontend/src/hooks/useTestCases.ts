import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/testCases';
import type { TestCaseCreatePayload, TestCasesFilters, TestCaseUpdatePayload } from '../types';

const testCaseKeys = {
  all: ['test-cases'] as const,
  list: (filters: TestCasesFilters) => [...testCaseKeys.all, 'list', filters] as const,
  detail: (id: number) => [...testCaseKeys.all, 'detail', id] as const,
};

export function useTestCases(filters: TestCasesFilters = {}) {
  return useQuery({
    queryKey: testCaseKeys.list(filters),
    queryFn: () => api.listTestCases(filters),
  });
}

export function useTestCase(id: number) {
  return useQuery({
    queryKey: testCaseKeys.detail(id),
    queryFn: () => api.getTestCase(id),
    enabled: id > 0,
  });
}

export function useCreateTestCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TestCaseCreatePayload) => api.createTestCase(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: testCaseKeys.all }),
  });
}

export function useUpdateTestCase(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TestCaseUpdatePayload) => api.updateTestCase(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: testCaseKeys.all }),
  });
}

export function useDeleteTestCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteTestCase(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testCaseKeys.all }),
  });
}
