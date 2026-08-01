import { useEffect, useState } from 'react';
import { carInsurancesApi } from 'src/api/car-insurance';
import type { CarInsurance } from '@libs/types';

interface UseCarInsuranceResult {
  carInsurance: CarInsurance | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCarInsurance = (carInsuranceId: number | undefined): UseCarInsuranceResult => {
  const [carInsurance, setCarInsurance] = useState<CarInsurance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCarInsurance = async () => {
    if (!carInsuranceId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await carInsurancesApi.getCarInsurance({ carInsuranceId });
      setCarInsurance(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch car insurance record');
      console.error('Error fetching car insurance record:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCarInsurance();
  }, [carInsuranceId]);

  const refetch = () => {
    fetchCarInsurance();
  };

  return {
    carInsurance,
    isLoading,
    error,
    refetch
  };
};
