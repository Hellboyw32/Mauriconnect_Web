import type { SettlementReportRow } from '@libs/types';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { reportApi } from 'src/api/report';
import { useMounted } from '../use-mounted';

export const useSettlementReport = () => {
  const isMounted = useMounted();
  const [rows, setRows] = useState<SettlementReportRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // true once a run has finished, so the page can say "no bookings" instead of
  // showing nothing for both "not run yet" and "ran, found nothing".
  const [hasRun, setHasRun] = useState<boolean>(false);

  const handleReportGet = useCallback(
    async (date: string) => {
      try {
        setIsLoading(true);
        const response = await reportApi.getSettlementReport({ date });

        if (isMounted()) {
          setRows(response);
          setHasRun(true);
        }
        return response;
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Failed to load the settlement report');
        if (isMounted()) {
          setRows([]);
          setHasRun(false);
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

  const reset = useCallback(() => {
    setRows([]);
    setHasRun(false);
  }, []);

  return {
    rows,
    isLoading,
    hasRun,
    handleReportGet,
    reset
  };
};
