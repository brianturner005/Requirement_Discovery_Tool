import { useQuery } from '@tanstack/react-query';
import { listVersions } from '../api/versions';

export function useVersions(reqId: string) {
  return useQuery({
    queryKey: ['versions', reqId],
    queryFn: () => listVersions(reqId),
    enabled: !!reqId,
  });
}
