import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/dashboard';
import type { DashboardStats } from '../types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardStats(): UseQueryResult<DashboardStats> {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000,
  });
}
