import { useEffect, useState } from 'react';
import type { Psvl } from '@libs/types';

import { psvlApi } from 'src/api/psvl';

interface UsePsvlResult {
  psvl: Psvl | null;
  isLoading: boolean;
  error: string | null;
}

export const usePsvl = (psvlId: number | undefined): UsePsvlResult => {
  const [psvl, setPsvl] = useState<Psvl | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!psvlId) {
      setIsLoading(false);
      return;
    }

    const fetchPsvl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setPsvl(await psvlApi.getPsvl(psvlId));
      } catch (err) {
        setError(err.message || 'Failed to fetch PSVL record');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPsvl();
  }, [psvlId]);

  return { psvl, isLoading, error };
};
