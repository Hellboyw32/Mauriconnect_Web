import type { Booking } from '@libs/types';
import { useCallback, useEffect, useState } from 'react';
import { bookingApi } from 'src/api/booking';
import { useMounted } from '../use-mounted';

export const useRecentBookings = (limit?: number) => {
  const isMounted = useMounted();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleBookingsGet = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await bookingApi.getRecentBookings(limit ? { limit } : undefined);

      if (isMounted()) {
        setBookings(response || []);
      }
    } catch (err) {
      console.error(err);
      if (isMounted()) {
        setBookings([]);
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [limit, isMounted]);

  useEffect(
    () => {
      handleBookingsGet();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [limit]
  );

  return {
    bookings,
    isLoading,
    refetch: handleBookingsGet
  };
};
