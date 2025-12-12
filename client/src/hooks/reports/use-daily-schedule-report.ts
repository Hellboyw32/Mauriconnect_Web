import type { Booking } from '@libs/types';
import { useCallback, useState } from 'react';
import { reportApi } from 'src/api/report';
import { useMounted } from '../use-mounted';

export const useDailyScheduleReport = () => {
  const isMounted = useMounted();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleBookingGet = useCallback(
    async (pickupDate?: string) => {
      try {
        setIsLoading(true);
        const response = await reportApi.getDailyScheduleReport(
          pickupDate ? { pickupDate } : undefined
        );

        if (isMounted()) {
          setBookings(response);
        }
        return response;
      } catch (err) {
        console.error(err);
        if (isMounted()) {
          setBookings([]);
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
    bookings,
    isLoading,
    handleBookingGet
  };
};
