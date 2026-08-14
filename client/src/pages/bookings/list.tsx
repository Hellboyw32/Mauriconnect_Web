import type { Booking, BookingsSearchState, Filters } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import PlusIcon from '@untitled-ui/icons-react/build/esm/Plus';
import RefreshCcw01Icon from '@untitled-ui/icons-react/build/esm/RefreshCcw01';
import type { ChangeEvent, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useBookings as useBookingsStore } from 'src/hooks/bookings/use-bookings';
import { useSelection } from 'src/hooks/use-selection';
import { paths } from 'src/paths';
import { BookingListSearch } from 'src/sections/booking/booking-list-search';
import { BookingListTable } from 'src/sections/booking/booking-list-table';

const useBookingsSearch = () => {
  const [state, setState] = useState<BookingsSearchState>({
    filters: {
      customerName: undefined,
      pickupDate: undefined,
      dropoffDate: undefined,
      referenceNo: undefined
    },
    page: 0,
    rowsPerPage: 50,
    sortBy: 'customerName',
    sortDir: 'asc'
  });

  const handleFiltersChange = useCallback((filters: Filters): void => {
    setState((prevState) => ({
      ...prevState,
      filters
    }));
  }, []);

  const handleSortChange = useCallback(
    (sort: { sortBy: string; sortDir: 'asc' | 'desc' }): void => {
      setState((prevState) => ({
        ...prevState,
        sortBy: sort.sortBy,
        sortDir: sort.sortDir
      }));
    },
    []
  );

  const handlePageChange = useCallback(
    (event: MouseEvent<HTMLButtonElement> | null, page: number): void => {
      setState((prevState) => ({
        ...prevState,
        page
      }));
    },
    []
  );

  const handleRowsPerPageChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setState((prevState) => ({
      ...prevState,
      rowsPerPage: parseInt(event.target.value, 10)
    }));
  }, []);

  return {
    handleFiltersChange,
    handleSortChange,
    handlePageChange,
    handleRowsPerPageChange,
    state
  };
};

const useBookingsIds = (bookings: Booking[] = []) => {
  return useMemo(() => {
    return bookings.map((booking) => booking.BookingId);
  }, [bookings]);
};

const Page = () => {
  const bookingsSearch = useBookingsSearch();
  const bookingsStore = useBookingsStore(bookingsSearch.state);
  const bookingsIds = useBookingsIds(bookingsStore.bookings);
  const bookingsSelection = useSelection<number>(bookingsIds);

  const handleRefresh = useCallback((): void => {
    // Reset filters to initial state
    bookingsSearch.handleFiltersChange({
      customerName: undefined,
      pickupDate: undefined,
      dropoffDate: undefined,
      referenceNo: undefined
    });
    // Trigger data refresh
    bookingsStore.handleBookingsGet();
  }, [bookingsStore, bookingsSearch]);

  return (
    <>
      <Seo title="Bookings: List" />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">Bookings</Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
              >
                <Button
                  component={RouterLink}
                  href={paths.bookings.create}
                  startIcon={
                    <SvgIcon>
                      <PlusIcon />
                    </SvgIcon>
                  }
                  variant="contained"
                >
                  Add
                </Button>
                <Button
                  onClick={handleRefresh}
                  startIcon={
                    bookingsStore.isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SvgIcon>
                        <RefreshCcw01Icon />
                      </SvgIcon>
                    )
                  }
                  variant="contained"
                  disabled={bookingsStore.isLoading}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
            <Card>
              <BookingListSearch
                onFiltersChange={bookingsSearch.handleFiltersChange}
                onSortChange={bookingsSearch.handleSortChange}
                sortBy={bookingsSearch.state.sortBy}
                sortDir={bookingsSearch.state.sortDir}
                filters={bookingsSearch.state.filters}
              />
              <BookingListTable
                count={bookingsStore.bookingsCount}
                items={bookingsStore.bookings}
                onDeselectAll={bookingsSelection.handleDeselectAll}
                onDeselectOne={bookingsSelection.handleDeselectOne}
                onPageChange={bookingsSearch.handlePageChange}
                onRowsPerPageChange={bookingsSearch.handleRowsPerPageChange}
                onSelectAll={bookingsSelection.handleSelectAll}
                onSelectOne={bookingsSelection.handleSelectOne}
                page={bookingsSearch.state.page}
                rowsPerPage={bookingsSearch.state.rowsPerPage}
                selected={bookingsSelection.selected}
                isLoading={bookingsStore.isLoading}
                onRefresh={handleRefresh}
              />
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
