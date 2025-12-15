import { useEffect, useState } from 'react';
import { carsApi } from 'src/api/car';
import type { TopRentedCars } from '@libs/types';

interface UseTopRentedCarsResult {
  cars: TopRentedCars;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTopRentedCars = (topCount: number = 8): UseTopRentedCarsResult => {
  const [cars, setCars] = useState<TopRentedCars>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await carsApi.getTopRentedCars(topCount);
      console.log('Hook received cars data:', data);
      console.log('Is array?', Array.isArray(data));
      console.log('Length:', data?.length);
      setCars(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch top rented cars');
      console.error('Error fetching top rented cars:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [topCount]);

  const refetch = () => {
    fetchCars();
  };

  return {
    cars,
    isLoading,
    error,
    refetch
  };
};
