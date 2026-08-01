import { useEffect, useState } from 'react';
import { roadTaxesApi } from 'src/api/road-tax';
import type { RoadTax } from '@libs/types';

interface UseRoadTaxResult {
  roadTax: RoadTax | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useRoadTax = (roadTaxId: number | undefined): UseRoadTaxResult => {
  const [roadTax, setRoadTax] = useState<RoadTax | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadTax = async () => {
    if (!roadTaxId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await roadTaxesApi.getRoadTax({ roadTaxId });
      setRoadTax(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch road tax record');
      console.error('Error fetching road tax record:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadTax();
  }, [roadTaxId]);

  const refetch = () => {
    fetchRoadTax();
  };

  return {
    roadTax,
    isLoading,
    error,
    refetch
  };
};
