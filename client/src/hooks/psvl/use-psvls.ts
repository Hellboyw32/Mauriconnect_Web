import { useCallback, useEffect, useState } from 'react';
import type { Psvls } from '@libs/types';

import { psvlApi } from 'src/api/psvl';

interface UsePsvlsResult {
  psvls: Psvls;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Pass a carId for one car's records, or { all: true } for every car's (PSVL list page).
export const usePsvls = (
  carId: number | undefined,
  options: { all?: boolean } = {}
): UsePsvlsResult => {
  const { all = false } = options;
  const [psvls, setPsvls] = useState<Psvls>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPsvls = useCallback(async () => {
    if (!carId && !all) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setPsvls(await psvlApi.getPsvls(carId));
    } catch (err) {
      setError(err.message || 'Failed to fetch PSVL records');
    } finally {
      setIsLoading(false);
    }
  }, [carId, all]);

  useEffect(() => {
    fetchPsvls();
  }, [fetchPsvls]);

  return { psvls, isLoading, error, refetch: fetchPsvls };
};
