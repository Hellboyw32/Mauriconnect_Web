import type { Servicing } from '@libs/types';
import { useEffect, useState } from 'react';

import { servicingApi } from 'src/api/servicing';

interface UseLastServicingResult {
  // The car's most recent COMPLETED servicing (by service date), or null if it has none.
  lastServicing: Servicing | null;
  isLoading: boolean;
}

// Finds when a car was last serviced from its servicing records, for the
// read-only "Last Serviced" reference on the servicing form. The record being
// edited is excluded so editing a completed record shows the service BEFORE it,
// not itself.
export const useLastServicing = (
  carId: number | '' | undefined,
  carNumber: string | null | undefined,
  excludeServicingId?: number
): UseLastServicingResult => {
  const [lastServicing, setLastServicing] = useState<Servicing | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!carId || !carNumber) {
      setLastServicing(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);

    servicingApi
      .getServicingHistory({ filters: { carNumber } })
      .then((records) => {
        if (cancelled) return;

        // The carNumber filter is a "contains" match, so keep this car's rows only.
        const latest = records
          .filter(
            (record) =>
              record.CarId === carId &&
              record.IsCompleted &&
              record.DateServiced &&
              record.ServicingId !== excludeServicingId
          )
          .sort((a, b) => {
            const byDate = String(b.DateServiced).localeCompare(String(a.DateServiced));
            return byDate || b.ServicingId - a.ServicingId;
          })[0];

        setLastServicing(latest ?? null);
      })
      .catch(() => !cancelled && setLastServicing(null))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [carId, carNumber, excludeServicingId]);

  return { lastServicing, isLoading };
};
