import { useEffect, useState } from 'react';
import { carsApi } from 'src/api/car';
import type { Cars, CarFilters } from '@libs/types';

interface UseCarsResult {
  cars: Cars;
  isLoading: boolean;
  error: string | null;
  refetch: (filters?: CarFilters) => void;
}

export const useCars = (initialFilters?: CarFilters): UseCarsResult => {
  const [cars, setCars] = useState<Cars>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = async (filters?: CarFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await carsApi.getCars({ filters });
      setCars(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch cars');
      console.error('Error fetching cars:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars(initialFilters);
  }, []);

  const refetch = (filters?: CarFilters) => {
    fetchCars(filters);
  };

  return {
    cars,
    isLoading,
    error,
    refetch
  };
};
