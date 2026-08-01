import type { Car, CarsSearchState, CarFilters } from '@libs/types';
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
import { useCars } from 'src/hooks/cars/use-cars';
import { useSelection } from 'src/hooks/use-selection';
import { paths } from 'src/paths';
import { CarListSearch } from 'src/sections/car/car-list-search';
import { CarListTable } from 'src/sections/car/car-list-table';

const useCarsSearch = () => {
  const [state, setState] = useState<CarsSearchState>({
    filters: {
      carNumber: undefined,
      categoryId: undefined
    },
    page: 0,
    rowsPerPage: -1,
    sortBy: 'CarNumber',
    sortDir: 'asc'
  });

  const handleFiltersChange = useCallback((filters: CarFilters): void => {
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

const useCarsIds = (cars: Car[] = []) => {
  return useMemo(() => {
    return cars.map((car) => car.CarId);
  }, [cars]);
};

const Page = () => {
  const carsSearch = useCarsSearch();
  const { cars, isLoading } = useCars(carsSearch.state.filters);
  const carsIds = useCarsIds(cars);
  const carsSelection = useSelection<number>(carsIds);

  const handleRefresh = useCallback((): void => {
    // Reset filters to initial state; the fetch re-runs reactively
    carsSearch.handleFiltersChange({
      carNumber: undefined,
      categoryId: undefined
    });
  }, [carsSearch]);

  return (
    <>
      <Seo title="Cars: List" />
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
                <Typography variant="h4">Cars</Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
              >
                <Button
                  component={RouterLink}
                  href={paths.cars.create}
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
              <CarListSearch
                onFiltersChange={carsSearch.handleFiltersChange}
                onSortChange={carsSearch.handleSortChange}
                sortBy={carsSearch.state.sortBy}
                sortDir={carsSearch.state.sortDir}
                filters={carsSearch.state.filters}
              />
              <CarListTable
                count={cars.length}
                items={cars}
                onDeselectAll={carsSelection.handleDeselectAll}
                onDeselectOne={carsSelection.handleDeselectOne}
                onPageChange={carsSearch.handlePageChange}
                onRowsPerPageChange={carsSearch.handleRowsPerPageChange}
                onSelectAll={carsSelection.handleSelectAll}
                onSelectOne={carsSelection.handleSelectOne}
                onSortChange={carsSearch.handleSortChange}
                page={carsSearch.state.page}
                rowsPerPage={carsSearch.state.rowsPerPage}
                selected={carsSelection.selected}
                sortBy={carsSearch.state.sortBy}
                sortDir={carsSearch.state.sortDir}
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
