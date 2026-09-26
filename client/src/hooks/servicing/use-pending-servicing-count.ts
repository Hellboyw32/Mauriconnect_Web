import { useCallback, useEffect, useState } from 'react';
import { servicingApi } from 'src/api/servicing';
import { useMounted } from '../use-mounted';

export const usePendingServicingCount = () => {
  const isMounted = useMounted();
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleCountGet = useCallback(async () => {
    try {
      setIsLoading(true);
      const servicingRecords = await servicingApi.getServicingHistory();
      const pendingCount = servicingRecords.filter((record) => !record.IsCompleted).length;

      if (isMounted()) {
        setCount(pendingCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [isMounted]);

  useEffect(
    () => {
      handleCountGet();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    count,
    isLoading,
    refetch: handleCountGet
  };
};
