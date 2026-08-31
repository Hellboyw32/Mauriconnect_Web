import type { UserLoginLogFilters, UserLoginLogs } from '@libs/types';
import { useCallback, useEffect, useState } from 'react';
import { adminLogsApi } from 'src/api/admin-logs';

interface UseLoginLogsResult {
  loginLogs: UserLoginLogs;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: UserLoginLogFilters) => void;
}

export const useLoginLogs = (filters?: UserLoginLogFilters): UseLoginLogsResult => {
  const [loginLogs, setLoginLogs] = useState<UserLoginLogs>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (currentFilters?: UserLoginLogFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminLogsApi.getLoginLogs(currentFilters);
      setLoginLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch login logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.username, filters?.fromDate, filters?.toDate, filters?.loginSuccessful]);

  const refetch = useCallback(
    (nextFilters?: UserLoginLogFilters) => fetchLogs(nextFilters ?? filters),
    [fetchLogs, filters]
  );

  return { loginLogs, isLoading, error, refetch };
};
