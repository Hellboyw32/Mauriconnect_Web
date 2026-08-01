import type { RoadTax, RoadTaxesSearchState, RoadTaxFilters } from '@libs/types';
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
import { useRoadTaxes } from 'src/hooks/road-tax/use-road-taxes';
import { useSelection } from 'src/hooks/use-selection';
import { paths } from 'src/paths';
import { applyPagination } from 'src/utils/apply-pagination';
import { applySort } from 'src/utils/apply-sort';
import { RoadTaxListSearch } from 'src/sections/road-tax/road-tax-list-search';
import { RoadTaxListTable } from 'src/sections/road-tax/road-tax-list-table';

const useRoadTaxesSearch = () => {
  const [state, setState] = useState<RoadTaxesSearchState>({
    filters: {
      carNumber: undefined
    },
    page: 0,
    rowsPerPage: -1,
    sortBy: 'StartDate',
    sortDir: 'desc'
  });

  const handleFiltersChange = useCallback((filters: RoadTaxFilters): void => {
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

const useRoadTaxesIds = (roadTaxes: RoadTax[] = []) => {
  return useMemo(() => {
    return roadTaxes.map((roadTax) => roadTax.RoadTaxId);
  }, [roadTaxes]);
};

const Page = () => {
  const roadTaxesSearch = useRoadTaxesSearch();
  const { roadTaxes, isLoading } = useRoadTaxes(roadTaxesSearch.state.filters);
  const roadTaxesIds = useRoadTaxesIds(roadTaxes);
  const roadTaxesSelection = useSelection<number>(roadTaxesIds);

  const handleRefresh = useCallback((): void => {
    // Reset filters to initial state; the fetch re-runs reactively
    roadTaxesSearch.handleFiltersChange({
      carNumber: undefined
    });
  }, [roadTaxesSearch]);

  const sorted = useMemo(
    () => applySort(roadTaxes, roadTaxesSearch.state.sortBy, roadTaxesSearch.state.sortDir),
    [roadTaxes, roadTaxesSearch.state.sortBy, roadTaxesSearch.state.sortDir]
  );
  const paginated = useMemo(
    () => applyPagination(sorted, roadTaxesSearch.state.page, roadTaxesSearch.state.rowsPerPage),
    [sorted, roadTaxesSearch.state.page, roadTaxesSearch.state.rowsPerPage]
  );

  return (
    <>
      <Seo title="Road Tax: List" />
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
                <Typography variant="h4">Road Tax</Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
              >
                <Button
                  component={RouterLink}
                  href={paths.roadTax.create}
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
              <RoadTaxListSearch
                onFiltersChange={roadTaxesSearch.handleFiltersChange}
                onSortChange={roadTaxesSearch.handleSortChange}
                sortBy={roadTaxesSearch.state.sortBy}
                sortDir={roadTaxesSearch.state.sortDir}
                filters={roadTaxesSearch.state.filters}
              />
              <RoadTaxListTable
                count={sorted.length}
                items={paginated}
                onDeselectAll={roadTaxesSelection.handleDeselectAll}
                onDeselectOne={roadTaxesSelection.handleDeselectOne}
                onPageChange={roadTaxesSearch.handlePageChange}
                onRowsPerPageChange={roadTaxesSearch.handleRowsPerPageChange}
                onSelectAll={roadTaxesSelection.handleSelectAll}
                onSelectOne={roadTaxesSelection.handleSelectOne}
                onSortChange={roadTaxesSearch.handleSortChange}
                onRefresh={handleRefresh}
                page={roadTaxesSearch.state.page}
                rowsPerPage={roadTaxesSearch.state.rowsPerPage}
                selected={roadTaxesSelection.selected}
                sortBy={roadTaxesSearch.state.sortBy}
                sortDir={roadTaxesSearch.state.sortDir}
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
