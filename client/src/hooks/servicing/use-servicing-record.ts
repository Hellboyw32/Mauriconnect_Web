import { useEffect, useState } from 'react';
import { servicingApi } from 'src/api/servicing';
import type { Servicing } from '@libs/types';

interface UseServicingRecordResult {
  servicingRecord: Servicing | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useServicingRecord = (servicingId: number | undefined): UseServicingRecordResult => {
  const [servicingRecord, setServicingRecord] = useState<Servicing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServicingRecord = async () => {
    if (!servicingId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await servicingApi.getServicingRecord({ servicingId });
      setServicingRecord(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch servicing record');
      console.error('Error fetching servicing record:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServicingRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicingId]);

  const refetch = () => {
    fetchServicingRecord();
  };

  return {
    servicingRecord,
    isLoading,
    error,
    refetch
  };
};
