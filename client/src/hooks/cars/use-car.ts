import { useEffect, useState } from 'react';
import { carsApi } from 'src/api/car';
import type { Car } from '@libs/types';

interface UseCarResult {
  car: Car | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCar = (carId: number | undefined): UseCarResult => {
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCar = async () => {
    if (!carId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await carsApi.getCar({ carId });
      setCar(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch car');
      console.error('Error fetching car:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCar();
  }, [carId]);

  const refetch = () => {
    fetchCar();
  };

  return {
    car,
    isLoading,
    error,
    refetch
  };
};
