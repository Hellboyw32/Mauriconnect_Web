import type { Booking } from '@libs/types';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  type GridColDef
} from '@mui/x-data-grid';
import { format } from 'date-fns';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { bookingApi } from 'src/api/booking';
import { reportApi } from 'src/api/report';
import { useMounted } from 'src/hooks/use-mounted';

export default function DailyScheduleReport({
  bookings,
  dropoffBookings: propDropoffBookings
}: {
  bookings: Booking[];
  dropoffBookings?: Booking[];
}): any {
  const isMounted = useMounted();
  const [dropoffBookings, setDropoffBookings] = useState<Booking[]>(propDropoffBookings || []);

  useEffect(() => {
    // If dropoffBookings are passed as props, use them
    if (propDropoffBookings) {
      setDropoffBookings(propDropoffBookings);
      return;
    }

    // Otherwise, fetch dropoff schedule (fallback for backward compatibility)
    const fetchDropoffSchedule = async () => {
      try {
        const data = await reportApi.getDropoffScheduleReport();
        if (isMounted()) {
          setDropoffBookings(data);
        }
      } catch (err) {
        console.error('Error fetching dropoff schedule:', err);
      }
    };

    if (bookings.length > 0) {
      fetchDropoffSchedule();
    }
  }, [bookings, propDropoffBookings, isMounted]);

  // Add print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        .report-title {
          display: block !important;
          font-size: 24px !important;
          font-weight: bold !important;
          margin-bottom: 16px !important;
          margin-top: 16px !important;
          page-break-after: avoid !important;
        }
        .dropoff-title {
          page-break-before: always !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
      field: 'id',
      headerName: '#',
      width: 20,
      type: 'number',
      valueGetter: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
    },
    {
      field: 'CustomerName',
      headerName: 'Customer Name',
      width: 150
    },
    {
      field: 'PickUpDate',
      headerName: 'Pickup Date',
      type: 'string',
      width: 120,
      valueGetter: ({ value }) => {
        if (!value) return '';
        try {
          const date = new Date(value);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          const hours = String(date.getUTCHours()).padStart(2, '0');
          const minutes = String(date.getUTCMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (error) {
          console.error('Error formatting PickUpDate:', value, error);
          return value;
        }
      }
    },
    {
      field: 'DropOffDate',
      headerName: 'Dropoff Date',
      type: 'string',
      width: 120,
      valueGetter: ({ value }) => {
        if (!value) return '';
        try {
          const date = new Date(value);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          const hours = String(date.getUTCHours()).padStart(2, '0');
          const minutes = String(date.getUTCMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch (error) {
          console.error('Error formatting DropOffDate:', value, error);
          return value;
        }
      }
    },
    {
      field: 'FlightNo',
      headerName: 'FlightNo.',
      type: 'string',
      width: 90
    },
    {
      field: 'NumberOfDays',
      headerName: ' Day(s)',
      type: 'number',
      width: 60
    },
    {
      field: 'Price',
      headerName: ' Price',
      type: 'string',
      width: 100
    },
    {
      field: 'Category',
      headerName: 'Car Model',
      type: 'string',
      width: 100,
      valueGetter: ({ row }) => row?.Category || ''
    },
    {
      field: 'SpecialRequest',
      headerName: ' Comments',
      type: 'string',
      width: 200,
      flex: 1,
      renderCell: (params) => (
        <div
          style={{
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            lineHeight: '1.5',
            padding: '8px 0',
            maxWidth: '100%'
          }}
        >
          {params.value}
        </div>
      )
    }
  ];

  const pickupLocationColumnIndex = columns.findIndex((column) => column.field === 'SpecialRequest');
  const pickupColumns: GridColDef[] = [
    ...columns.slice(0, pickupLocationColumnIndex),
    {
      field: 'PickupLocation',
      headerName: 'Pickup Location',
      type: 'string',
      width: 150
    },
    ...columns.slice(pickupLocationColumnIndex)
  ];

  const PickupToolbar = () => (
    <GridToolbarContainer>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          width: '100%'
        }}
      >
        Pickup Schedule
      </div>
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const DropoffToolbar = () => (
    <GridToolbarContainer>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          width: '100%'
        }}
      >
        Drop-off Schedule
      </div>
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Pickup Schedule */}
      <Box sx={{ mb: 4 }}>
        <div style={{ width: '99%' }}>
          <DataGrid
            getRowId={(row) => row.BookingId}
            columns={pickupColumns}
            rows={bookings}
            slots={{
              toolbar: PickupToolbar
            }}
            getRowHeight={() => 'auto'}
            autoHeight
            disableVirtualization
            sx={{
              boxShadow: 2,
              border: 2,
              borderColor: 'primary.light',
              '& .MuiDataGrid-cell': {
                py: 1,
                whiteSpace: 'normal !important',
                wordWrap: 'break-word',
                lineHeight: '1.5',
                overflowWrap: 'anywhere'
              },
              '& .MuiDataGrid-cell:hover': {
                color: 'primary.main'
              },
              '& .MuiDataGrid-row': {
                maxHeight: 'none !important'
              },
              '@media print': {
                width: 'max-content !important',
                minWidth: '100% !important',
                fontSize: '10px !important',
                '& .MuiDataGrid-main': {
                  overflow: 'visible !important'
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflow: 'visible !important',
                  height: 'auto !important'
                },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal !important',
                  wordWrap: 'break-word !important',
                  overflowWrap: 'anywhere !important',
                  wordBreak: 'break-word !important',
                  maxWidth: '200px !important'
                },
                '& .MuiDataGrid-row': {
                  pageBreakInside: 'avoid',
                  maxHeight: 'none !important'
                }
              }
            }}
          />
        </div>
      </Box>

      {/* Drop-off Schedule */}
      <Box sx={{ mt: 4 }}>
        <div style={{ width: '99%' }}>
          <DataGrid
            getRowId={(row) => row.BookingId}
            columns={columns}
            rows={dropoffBookings}
            slots={{
              toolbar: DropoffToolbar
            }}
            getRowHeight={() => 'auto'}
            autoHeight
            disableVirtualization
            sx={{
              boxShadow: 2,
              border: 2,
              borderColor: 'primary.light',
              '& .MuiDataGrid-cell': {
                py: 1,
                whiteSpace: 'normal !important',
                wordWrap: 'break-word',
                lineHeight: '1.5',
                overflowWrap: 'anywhere'
              },
              '& .MuiDataGrid-cell:hover': {
                color: 'primary.main'
              },
              '& .MuiDataGrid-row': {
                maxHeight: 'none !important'
              },
              '@media print': {
                width: 'max-content !important',
                minWidth: '100% !important',
                fontSize: '10px !important',
                '& .MuiDataGrid-main': {
                  overflow: 'visible !important'
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflow: 'visible !important',
                  height: 'auto !important'
                },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal !important',
                  wordWrap: 'break-word !important',
                  overflowWrap: 'anywhere !important',
                  wordBreak: 'break-word !important',
                  maxWidth: '200px !important'
                },
                '& .MuiDataGrid-row': {
                  pageBreakInside: 'avoid',
                  maxHeight: 'none !important'
                }
              }
            }}
          />
        </div>
      </Box>
    </Box>
  );
}
