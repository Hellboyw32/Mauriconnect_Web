import { useEffect, useRef, useState } from 'react';
import { carInsurancesApi } from 'src/api/car-insurance';
import type { CarInsurances, CarInsuranceFilters } from '@libs/types';

interface UseCarInsurancesResult {
  carInsurances: CarInsurances;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: CarInsuranceFilters) => void;
}

export const useCarInsurances = (initialFilters?: CarInsuranceFilters): UseCarInsurancesResult => {
  const [carInsurances, setCarInsurances] = useState<CarInsurances>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevFiltersRef = useRef<string>();
  const hasFetchedRef = useRef(false);

  const fetchCarInsurances = async (filters?: CarInsuranceFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await carInsurancesApi.getCarInsurances({ filters });
      setCarInsurances(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch car insurance records');
      console.error('Error fetching car insurance records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentFilters = JSON.stringify(initialFilters);
    if (!hasFetchedRef.current || prevFiltersRef.current !== currentFilters) {
      hasFetchedRef.current = true;
      prevFiltersRef.current = currentFilters;
      fetchCarInsurances(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  const refetch = (filters?: CarInsuranceFilters) => {
    fetchCarInsurances(filters);
  };

  return {
    carInsurances,
    isLoading,
    error,
    refetch
  };
};
