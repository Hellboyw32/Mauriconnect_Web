import type { Booking } from '@libs/types';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  type GridColDef
} from '@mui/x-data-grid';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { bookingApi } from 'src/api/booking';
import { useMounted } from 'src/hooks/use-mounted';

export default function DailyScheduleReport({ bookings }: { bookings: Booking[] }): any {
  interface Filters {
    query?: string;
  }

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

  const useBookingsStore = () => {
    const isMounted = useMounted();
    const [state, setState] = useState<BookingsStoreState>({
      bookings: [],
      bookingsCount: 0
    });

    const handleBookingsGet = useCallback(async () => {
      try {
        const response = await bookingApi.getBookings();

        if (isMounted()) {
          setState({
            bookings: response.data,
            bookingsCount: response.count
          });
        }
      } catch (err) {
        console.error(err);
      }
    }, [isMounted]);

    // useEffect(
    //   () => {
    //     handleBookingsGet();
    // //   },
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    //   []
    // );

    return {
      ...state
    };
  };

  const columns: GridColDef[] = [
    {
      field: 'CustomerName',
      headerName: 'Customer Name',
      width: 150
    },
    {
      field: 'PickUpDate',
      headerName: 'Pickup Date',
      type: 'datetime',
      width: 200,
      valueGetter: ({ value }) => value && new Date(value).toString()
    },
    {
      field: 'DropOffDate',
      headerName: 'Dropoff Date',
      type: 'datetime',
      width: 110,
      valueGetter: ({ value }) => value && new Date(value)
    },
    {
      field: 'FlightNo',
      headerName: 'FlightNo.',
      type: 'string',
      width: 90
    },
    {
      field: 'numberOfDays',
      headerName: ' Day(s)',
      type: 'number',
      width: 60
    },
    {
      field: 'Price',
      headerName: ' Price',
      type: 'number',
      width: 150
    },
    {
      field: 'model',
      headerName: 'Car Model',
      type: 'number',
      width: 100
    },
    {
      field: 'SpecialRequest',
      headerName: ' Comments',
      type: 'string',
      width: 160
    }
  ];

  return (
    <div style={{ height: 700, width: '100%', marginLeft: '1%' }}>
      <DataGrid
        getRowId={(row) => row.BookingId}
        columns={columns}
        rows={bookings}
        slots={{
          toolbar: GridToolbarExport
        }}
        sx={{
          boxShadow: 2,
          border: 2,
          borderColor: 'primary.light',
          '& .MuiDataGrid-cell:hover': {
            color: 'primary.main'
          }
        }}
      />
    </div>
  );
}
