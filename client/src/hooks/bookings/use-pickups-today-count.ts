import { useCallback, useEffect, useState } from 'react';
import { bookingApi } from 'src/api/booking';
import { useMounted } from '../use-mounted';

export const usePickupsTodayCount = () => {
  const isMounted = useMounted();
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleCountGet = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await bookingApi.getPickupsTodayCount();

      if (isMounted()) {
        setCount(response);
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
