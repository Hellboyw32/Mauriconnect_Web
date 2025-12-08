import type { Booking } from '@libs/types';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { reportApi } from 'src/api/report';
import { useMounted } from '../use-mounted';

export const useDailyScheduleReport = () => {
    const isMounted = useMounted();
    const [booking, setBooking] = useState<Booking[]>([]);
    const { bookingId } = useParams();
  
    const handleBookingGet = useCallback(async () => {
      try {
        const response = await reportApi.getDailyScheduleReport({ BookingId: parseInt(bookingId!) });
  
        if (isMounted()) {
          setBooking(response);
        }
      } catch (err) {
        console.error(err);
      }
    }, [bookingId, isMounted]);
  
    useEffect(
      () => {
        handleBookingGet();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    return {
      ...booking,
      handleBookingGet
    }
  
    
  };
  