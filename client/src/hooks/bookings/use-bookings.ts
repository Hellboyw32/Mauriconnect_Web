import type { Booking, Filters } from '@libs/types';
import { useCallback, useEffect, useState } from 'react';
import { bookingApi } from 'src/api/booking';
import { useMounted } from '../use-mounted';

interface BookingsSearchState {
  filters: Filters;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

interface BookingsStoreState {
  bookings: Booking[];
  bookingsCount: number;
}

export const useBookings = (searchState: BookingsSearchState) => {
  const isMounted = useMounted();
  const [state, setState] = useState<BookingsStoreState>({
    bookings: [],
    bookingsCount: 0
  });

  const handleBookingsGet = useCallback(async () => {
    try {
      const response = await bookingApi.getBookings(searchState);

      if (isMounted()) {
        setState({
          bookings: response.data,
          bookingsCount: response.count
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [searchState, isMounted]);

  useEffect(
    () => {
      handleBookingsGet();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchState]
  );

  return {
    handleBookingsGet,
    ...state
  };
};
