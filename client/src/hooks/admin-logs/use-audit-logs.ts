import type { AuditLogFilters, AuditLogs } from '@libs/types';
import { useCallback, useEffect, useState } from 'react';
import { adminLogsApi } from 'src/api/admin-logs';

interface UseAuditLogsResult {
  auditLogs: AuditLogs;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: AuditLogFilters) => void;
}

export const useAuditLogs = (filters?: AuditLogFilters): UseAuditLogsResult => {
  const [auditLogs, setAuditLogs] = useState<AuditLogs>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (currentFilters?: AuditLogFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminLogsApi.getAuditLogs(currentFilters);
      setAuditLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.username, filters?.action, filters?.fromDate, filters?.toDate]);

  const refetch = useCallback(
    (nextFilters?: AuditLogFilters) => fetchLogs(nextFilters ?? filters),
    [fetchLogs, filters]
  );

  return { auditLogs, isLoading, error, refetch };
};
