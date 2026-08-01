import { useEffect, useRef, useState } from 'react';
import { fitnessCertificatesApi } from 'src/api/fitness-certificate';
import type { FitnessCertificates, FitnessCertificateFilters } from '@libs/types';

interface UseFitnessCertificatesResult {
  fitnessCertificates: FitnessCertificates;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: FitnessCertificateFilters) => void;
}

export const useFitnessCertificates = (
  initialFilters?: FitnessCertificateFilters
): UseFitnessCertificatesResult => {
  const [fitnessCertificates, setFitnessCertificates] = useState<FitnessCertificates>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevFiltersRef = useRef<string>();

  const fetchFitnessCertificates = async (filters?: FitnessCertificateFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fitnessCertificatesApi.getFitnessCertificates({ filters });
      setFitnessCertificates(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch fitness certificate records');
      console.error('Error fetching fitness certificate records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentFilters = JSON.stringify(initialFilters);
    if (prevFiltersRef.current !== currentFilters) {
      prevFiltersRef.current = currentFilters;
      fetchFitnessCertificates(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  const refetch = (filters?: FitnessCertificateFilters) => {
    fetchFitnessCertificates(filters);
  };

  return {
    fitnessCertificates,
    isLoading,
    error,
    refetch
  };
};
