import { useEffect, useRef, useState } from 'react';
import { servicingApi } from 'src/api/servicing';
import type { ServicingRecords, ServicingFilters } from '@libs/types';

interface UseServicingHistoryResult {
  servicingRecords: ServicingRecords;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: ServicingFilters) => void;
}

export const useServicingHistory = (initialFilters?: ServicingFilters): UseServicingHistoryResult => {
  const [servicingRecords, setServicingRecords] = useState<ServicingRecords>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevFiltersRef = useRef<string>();

  const fetchServicingHistory = async (filters?: ServicingFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await servicingApi.getServicingHistory({ filters });
      setServicingRecords(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch servicing history');
      console.error('Error fetching servicing history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentFilters = JSON.stringify(initialFilters);
    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters;
      fetchServicingHistory(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  const refetch = (filters?: ServicingFilters) => {
    fetchServicingHistory(filters);
  };

  return {
    servicingRecords,
    isLoading,
    error,
    refetch
  };
};
