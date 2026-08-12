import { useEffect, useRef, useState } from 'react';
import { roadTaxesApi } from 'src/api/road-tax';
import type { RoadTaxes, RoadTaxFilters } from '@libs/types';

interface UseRoadTaxesResult {
  roadTaxes: RoadTaxes;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: RoadTaxFilters) => void;
}

export const useRoadTaxes = (initialFilters?: RoadTaxFilters): UseRoadTaxesResult => {
  const [roadTaxes, setRoadTaxes] = useState<RoadTaxes>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevFiltersRef = useRef<string>();
  const hasFetchedRef = useRef(false);

  const fetchRoadTaxes = async (filters?: RoadTaxFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await roadTaxesApi.getRoadTaxes({ filters });
      setRoadTaxes(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch road tax records');
      console.error('Error fetching road tax records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentFilters = JSON.stringify(initialFilters);
    if (!hasFetchedRef.current || prevFiltersRef.current !== currentFilters) {
      hasFetchedRef.current = true;
      prevFiltersRef.current = currentFilters;
      fetchRoadTaxes(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  const refetch = (filters?: RoadTaxFilters) => {
    fetchRoadTaxes(filters);
  };

  return {
    roadTaxes,
    isLoading,
    error,
    refetch
  };
};
