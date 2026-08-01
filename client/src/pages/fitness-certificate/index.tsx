import type {
  FitnessCertificate,
  FitnessCertificatesSearchState,
  FitnessCertificateFilters
} from '@libs/types';
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
import { useFitnessCertificates } from 'src/hooks/fitness-certificate/use-fitness-certificates';
import { useSelection } from 'src/hooks/use-selection';
import { paths } from 'src/paths';
import { applyPagination } from 'src/utils/apply-pagination';
import { applySort } from 'src/utils/apply-sort';
import { FitnessCertificateListSearch } from 'src/sections/fitness-certificate/fitness-certificate-list-search';
import { FitnessCertificateListTable } from 'src/sections/fitness-certificate/fitness-certificate-list-table';

const useFitnessCertificatesSearch = () => {
  const [state, setState] = useState<FitnessCertificatesSearchState>({
    filters: {
      carNumber: undefined
    },
    page: 0,
    rowsPerPage: -1,
    sortBy: 'StartDate',
    sortDir: 'desc'
  });

  const handleFiltersChange = useCallback((filters: FitnessCertificateFilters): void => {
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

const useFitnessCertificatesIds = (fitnessCertificates: FitnessCertificate[] = []) => {
  return useMemo(() => {
    return fitnessCertificates.map((fitnessCertificate) => fitnessCertificate.FitnessId);
  }, [fitnessCertificates]);
};

const Page = () => {
  const fitnessCertificatesSearch = useFitnessCertificatesSearch();
  const { fitnessCertificates, isLoading } = useFitnessCertificates(
    fitnessCertificatesSearch.state.filters
  );
  const fitnessCertificatesIds = useFitnessCertificatesIds(fitnessCertificates);
  const fitnessCertificatesSelection = useSelection<number>(fitnessCertificatesIds);

  const handleRefresh = useCallback((): void => {
    // Reset filters to initial state; the fetch re-runs reactively
    fitnessCertificatesSearch.handleFiltersChange({
      carNumber: undefined
    });
  }, [fitnessCertificatesSearch]);

  const sorted = useMemo(
    () =>
      applySort(
        fitnessCertificates,
        fitnessCertificatesSearch.state.sortBy,
        fitnessCertificatesSearch.state.sortDir
      ),
    [fitnessCertificates, fitnessCertificatesSearch.state.sortBy, fitnessCertificatesSearch.state.sortDir]
  );
  const paginated = useMemo(
    () =>
      applyPagination(
        sorted,
        fitnessCertificatesSearch.state.page,
        fitnessCertificatesSearch.state.rowsPerPage
      ),
    [sorted, fitnessCertificatesSearch.state.page, fitnessCertificatesSearch.state.rowsPerPage]
  );

  return (
    <>
      <Seo title="Fitness Certificate: List" />
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
                <Typography variant="h4">Fitness Certificate</Typography>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                spacing={2}
              >
                <Button
                  component={RouterLink}
                  href={paths.fitnessCertificate.create}
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
              <FitnessCertificateListSearch
                onFiltersChange={fitnessCertificatesSearch.handleFiltersChange}
                onSortChange={fitnessCertificatesSearch.handleSortChange}
                sortBy={fitnessCertificatesSearch.state.sortBy}
                sortDir={fitnessCertificatesSearch.state.sortDir}
                filters={fitnessCertificatesSearch.state.filters}
              />
              <FitnessCertificateListTable
                count={sorted.length}
                items={paginated}
                onDeselectAll={fitnessCertificatesSelection.handleDeselectAll}
                onDeselectOne={fitnessCertificatesSelection.handleDeselectOne}
                onPageChange={fitnessCertificatesSearch.handlePageChange}
                onRowsPerPageChange={fitnessCertificatesSearch.handleRowsPerPageChange}
                onSelectAll={fitnessCertificatesSelection.handleSelectAll}
                onSelectOne={fitnessCertificatesSelection.handleSelectOne}
                onSortChange={fitnessCertificatesSearch.handleSortChange}
                onRefresh={handleRefresh}
                page={fitnessCertificatesSearch.state.page}
                rowsPerPage={fitnessCertificatesSearch.state.rowsPerPage}
                selected={fitnessCertificatesSelection.selected}
                sortBy={fitnessCertificatesSearch.state.sortBy}
                sortDir={fitnessCertificatesSearch.state.sortDir}
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
