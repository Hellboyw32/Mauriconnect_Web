import type { CarInsurance, CarInsurancesSearchState, CarInsuranceFilters } from '@libs/types';
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
import { hasPermission } from '@libs/permissions';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useAuth } from 'src/hooks/use-auth';
import { useCarInsurances } from 'src/hooks/car-insurance/use-car-insurances';
import { useSelection } from 'src/hooks/use-selection';
import { paths } from 'src/paths';
import { applyPagination } from 'src/utils/apply-pagination';
import { applySort } from 'src/utils/apply-sort';
import { CarInsuranceListSearch } from 'src/sections/car-insurance/car-insurance-list-search';
import { CarInsuranceListTable } from 'src/sections/car-insurance/car-insurance-list-table';

const useCarInsurancesSearch = () => {
  const [state, setState] = useState<CarInsurancesSearchState>({
    filters: {
      carNumber: undefined
    },
    page: 0,
    rowsPerPage: -1,
    sortBy: 'StartDate',
    sortDir: 'desc'
  });

  const handleFiltersChange = useCallback((filters: CarInsuranceFilters): void => {
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

const useCarInsurancesIds = (carInsurances: CarInsurance[] = []) => {
  return useMemo(() => {
    return carInsurances.map((carInsurance) => carInsurance.CarInsuranceId);
  }, [carInsurances]);
};

const Page = () => {
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'CarInsurance', 'Create');
  const carInsurancesSearch = useCarInsurancesSearch();
  const { carInsurances, isLoading } = useCarInsurances(carInsurancesSearch.state.filters);
  const carInsurancesIds = useCarInsurancesIds(carInsurances);
  const carInsurancesSelection = useSelection<number>(carInsurancesIds);

  const handleRefresh = useCallback((): void => {
    // Reset filters to initial state; the fetch re-runs reactively
    carInsurancesSearch.handleFiltersChange({
      carNumber: undefined
    });
  }, [carInsurancesSearch]);

  const sorted = useMemo(
    () =>
      applySort(carInsurances, carInsurancesSearch.state.sortBy, carInsurancesSearch.state.sortDir),
    [carInsurances, carInsurancesSearch.state.sortBy, carInsurancesSearch.state.sortDir]
  );
  const paginated = useMemo(
    () => applyPagination(sorted, carInsurancesSearch.state.page, carInsurancesSearch.state.rowsPerPage),
    [sorted, carInsurancesSearch.state.page, carInsurancesSearch.state.rowsPerPage]
  );

  return (
    <>
      <Seo title="Car Insurance: List" />
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
                <Typography variant="h4">Car Insurance</Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
              >
                {canCreate && (
                  <Button
                    component={RouterLink}
                    href={paths.carInsurance.create}
                    startIcon={
                      <SvgIcon>
                        <PlusIcon />
                      </SvgIcon>
                    }
                    variant="contained"
                  >
                    Add
                  </Button>
                )}
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
              <CarInsuranceListSearch
                onFiltersChange={carInsurancesSearch.handleFiltersChange}
                onSortChange={carInsurancesSearch.handleSortChange}
                sortBy={carInsurancesSearch.state.sortBy}
                sortDir={carInsurancesSearch.state.sortDir}
                filters={carInsurancesSearch.state.filters}
              />
              <CarInsuranceListTable
                count={sorted.length}
                items={paginated}
                onDeselectAll={carInsurancesSelection.handleDeselectAll}
                onDeselectOne={carInsurancesSelection.handleDeselectOne}
                onPageChange={carInsurancesSearch.handlePageChange}
                onRowsPerPageChange={carInsurancesSearch.handleRowsPerPageChange}
                onSelectAll={carInsurancesSelection.handleSelectAll}
                onSelectOne={carInsurancesSelection.handleSelectOne}
                onSortChange={carInsurancesSearch.handleSortChange}
                onRefresh={handleRefresh}
                page={carInsurancesSearch.state.page}
                rowsPerPage={carInsurancesSearch.state.rowsPerPage}
                selected={carInsurancesSelection.selected}
                sortBy={carInsurancesSearch.state.sortBy}
                sortDir={carInsurancesSearch.state.sortDir}
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
