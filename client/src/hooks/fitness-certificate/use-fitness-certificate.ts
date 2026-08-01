import { useEffect, useState } from 'react';
import { fitnessCertificatesApi } from 'src/api/fitness-certificate';
import type { FitnessCertificate } from '@libs/types';

interface UseFitnessCertificateResult {
  fitnessCertificate: FitnessCertificate | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFitnessCertificate = (fitnessId: number | undefined): UseFitnessCertificateResult => {
  const [fitnessCertificate, setFitnessCertificate] = useState<FitnessCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFitnessCertificate = async () => {
    if (!fitnessId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fitnessCertificatesApi.getFitnessCertificate({ fitnessId });
      setFitnessCertificate(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch fitness certificate record');
      console.error('Error fetching fitness certificate record:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFitnessCertificate();
  }, [fitnessId]);

  const refetch = () => {
    fetchFitnessCertificate();
  };

  return {
    fitnessCertificate,
    isLoading,
    error,
    refetch
  };
};
