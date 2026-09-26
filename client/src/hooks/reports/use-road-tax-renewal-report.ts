import type { RoadTaxRenewalReportItem } from '@libs/types';
import { useCallback, useState } from 'react';
import { reportApi } from 'src/api/report';
import { useMounted } from '../use-mounted';

export const useRoadTaxRenewalReport = () => {
  const isMounted = useMounted();
  const [items, setItems] = useState<RoadTaxRenewalReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleReportGet = useCallback(
    async (year: number, month: number) => {
      try {
        setIsLoading(true);
        const response = await reportApi.getRoadTaxRenewalReport({ year, month });

        if (isMounted()) {
          setItems(response);
        }
        return response;
      } catch (err) {
        console.error(err);
        if (isMounted()) {
          setItems([]);
        }
        return [];
      } finally {
        if (isMounted()) {
          setIsLoading(false);
        }
      }
    },
    [isMounted]
  );

  return {
    items,
    isLoading,
    handleReportGet
  };
};
