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
  isLoading: boolean;
}

export const useBookings = (searchState: BookingsSearchState) => {
  const isMounted = useMounted();
  const [state, setState] = useState<BookingsStoreState>({
    bookings: [],
    bookingsCount: 0,
    isLoading: false
  });

  const handleBookingsGet = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const response = await bookingApi.getBookings(searchState);

      if (isMounted()) {
        setState({
          bookings: response.data,
          bookingsCount: response.count,
          isLoading: false
        });
      }
    } catch (err) {
      console.error(err);
      if (isMounted()) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
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
