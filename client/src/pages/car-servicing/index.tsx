import type { Servicing, ServicingFilters, ServicingSearchState } from '@libs/types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
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
import { useServicingHistory } from 'src/hooks/servicing/use-servicing-history';
import { paths } from 'src/paths';
import { applyPagination } from 'src/utils/apply-pagination';
import { CarServicingListSearch } from 'src/sections/car-servicing/car-servicing-list-search';
import { CarServicingListTable } from 'src/sections/car-servicing/car-servicing-list-table';

const useServicingSearch = () => {
  const [state, setState] = useState<ServicingSearchState>({
    filters: {
      carNumber: undefined
    },
    page: 0,
    rowsPerPage: 25,
    sortBy: 'DateServiced',
    sortDir: 'desc'
  });

  const handleFiltersChange = useCallback((filters: ServicingFilters): void => {
    setState((prevState) => ({
      ...prevState,
      page: 0,
      filters
    }));
  }, []);

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
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10)
    }));
  }, []);

  return {
    handleFiltersChange,
    handlePageChange,
    handleRowsPerPageChange,
    state
  };
};

const Page = () => {
  const servicingSearch = useServicingSearch();
  const { servicingRecords, isLoading, refetch } = useServicingHistory(
    servicingSearch.state.filters
  );

  const handleRefresh = useCallback((): void => {
    refetch(servicingSearch.state.filters);
  }, [refetch, servicingSearch.state.filters]);

  const paginated = useMemo<Servicing[]>(
    () =>
      applyPagination(
        servicingRecords,
        servicingSearch.state.page,
        servicingSearch.state.rowsPerPage
      ),
    [servicingRecords, servicingSearch.state.page, servicingSearch.state.rowsPerPage]
  );

  return (
    <>
      <Seo title="Car Servicing: History" />
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
                <Typography variant="h4">Car Servicing</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Add a servicing record for a vehicle and review its servicing history.
                </Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
              >
                <Button
                  component={RouterLink}
                  href={paths.carServicing.create}
                  startIcon={
                    <SvgIcon>
                      <PlusIcon />
                    </SvgIcon>
                  }
                  variant="contained"
                >
                  Add Servicing Record
                </Button>
                <Button
                  onClick={handleRefresh}
                  startIcon={
                    <SvgIcon>
                      <RefreshCcw01Icon />
                    </SvgIcon>
                  }
                  variant="contained"
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
            <Card>
              <CarServicingListSearch
                onFiltersChange={servicingSearch.handleFiltersChange}
                filters={servicingSearch.state.filters}
              />
              <CarServicingListTable
                count={servicingRecords.length}
                items={paginated}
                onPageChange={servicingSearch.handlePageChange}
                onRowsPerPageChange={servicingSearch.handleRowsPerPageChange}
                page={servicingSearch.state.page}
                rowsPerPage={servicingSearch.state.rowsPerPage}
                isLoading={isLoading}
              />
            </Card>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
