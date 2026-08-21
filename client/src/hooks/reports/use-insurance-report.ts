import type { InsuranceReportRow } from '@libs/types';
import { useCallback, useState } from 'react';
import { reportApi } from 'src/api/report';
import { useMounted } from '../use-mounted';

export const useInsuranceReport = () => {
  const isMounted = useMounted();
  const [rows, setRows] = useState<InsuranceReportRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleReportGet = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        setIsLoading(true);
        const response = await reportApi.getInsuranceReport({ startDate, endDate });

        if (isMounted()) {
          setRows(response);
        }
        return response;
      } catch (err) {
        console.error(err);
        if (isMounted()) {
          setRows([]);
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
    rows,
    isLoading,
    handleReportGet
  };
};
