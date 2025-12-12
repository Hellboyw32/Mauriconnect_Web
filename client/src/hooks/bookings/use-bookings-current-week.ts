import type { Booking } from '@libs/types';
import { useCallback, useEffect, useState } from 'react';
import { bookingApi } from 'src/api/booking';
import { useMounted } from '../use-mounted';

export const useBookingsCurrentWeek = () => {
  const isMounted = useMounted();
  const [weekData, setWeekData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWeekData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await bookingApi.getBookingsCurrentWeek();

      if (isMounted()) {
        setWeekData(data);
      }
    } catch (err) {
      console.error(err);
      if (isMounted()) {
        setWeekData([0, 0, 0, 0, 0, 0, 0]);
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [isMounted]);

  useEffect(
    () => {
      fetchWeekData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    weekData,
    isLoading,
    refetch: fetchWeekData
  };
};
