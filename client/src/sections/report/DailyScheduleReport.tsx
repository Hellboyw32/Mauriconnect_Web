import type { Booking } from '@libs/types';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  type GridColDef
} from '@mui/x-data-grid';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import Download01Icon from '@untitled-ui/icons-react/build/esm/Download01';
import { bookingApi } from 'src/api/booking';
import { reportApi } from 'src/api/report';
import { useMounted } from 'src/hooks/use-mounted';
import { getBookingComments } from 'src/utils/format-booking-comments';
import { DailySchedulePdfDocument } from './daily-schedule-pdf-document';

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
      minWidth: 200,
      flex: 1,
      valueGetter: ({ row }) => getBookingComments(row),
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

  const dropoffLocationColumnIndex = columns.findIndex(
    (column) => column.field === 'SpecialRequest'
  );
  const dropoffColumns: GridColDef[] = [
    ...columns
      .slice(0, dropoffLocationColumnIndex)
      .filter((column) => column.field !== 'FlightNo' && column.field !== 'NumberOfDays')
      .map((column) =>
        column.field === 'Category'
          ? {
              field: 'CarNumber',
              headerName: 'Car Number',
              type: 'string',
              width: 160
            }
          : column
      ),
    {
      field: 'FuelLevel',
      headerName: 'Fuel Level',
      type: 'string',
      width: 100
    },
    {
      field: 'DropOffPlace',
      headerName: 'Drop-off Location',
      type: 'string',
      width: 150
    },
    {
      field: 'DeliveredBy',
      headerName: 'Delivered By',
      type: 'string',
      width: 130
    },
    ...columns.slice(dropoffLocationColumnIndex)
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
      <GridToolbarExport printOptions={{ disableToolbarButton: true }} />
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
      <GridToolbarExport printOptions={{ disableToolbarButton: true }} />
    </GridToolbarContainer>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        direction="row"
        justifyContent="flex-end"
        sx={{ mb: 2 }}
      >
        <PDFDownloadLink
          document={
            <DailySchedulePdfDocument
              bookings={bookings}
              dropoffBookings={dropoffBookings}
            />
          }
          fileName={`daily-schedule-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
        >
          {({ loading }) => (
            <Button
              variant="contained"
              startIcon={
                <SvgIcon>
                  <Download01Icon />
                </SvgIcon>
              }
              disabled={loading}
            >
              {loading ? 'Preparing PDF...' : 'Download PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </Stack>
      {/* Pickup Schedule */}
      <Box sx={{ mb: 4 }}>
        <div style={{ width: '100%' }}>
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
              width: '100%',
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
                width: '100% !important',
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
                },
                // Force a page break after every 10th row so at most 10 records print per page
                '& .MuiDataGrid-row:nth-of-type(10n):not(:last-of-type)': {
                  pageBreakAfter: 'always !important'
                }
              }
            }}
          />
        </div>
      </Box>

      {/* Drop-off Schedule */}
      <Box sx={{ mt: 4 }}>
        <div style={{ width: '100%' }}>
          <DataGrid
            getRowId={(row) => row.BookingId}
            columns={dropoffColumns}
            rows={dropoffBookings}
            slots={{
              toolbar: DropoffToolbar
            }}
            getRowHeight={() => 'auto'}
            autoHeight
            disableVirtualization
            sx={{
              width: '100%',
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
                width: '100% !important',
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
                },
                // Force a page break after every 10th row so at most 10 records print per page
                '& .MuiDataGrid-row:nth-of-type(10n):not(:last-of-type)': {
                  pageBreakAfter: 'always !important'
                }
              }
            }}
          />
        </div>
      </Box>
    </Box>
  );
}
