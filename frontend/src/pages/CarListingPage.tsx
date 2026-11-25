import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Alert, Box, Button, Chip, Collapse, Grid2 as Grid, Paper, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { CarCard } from '../components/CarCard';
import { ErrorState, LoadingState } from '../components/common';
import { SearchForm } from '../components/SearchForm';
import { useBookingSession } from '../hooks/useBookingSession';
import { BookingLayout } from '../layouts/BookingLayout';
import { ApiError, errorMessage } from '../services/apiClient';
import { catalogService } from '../services/catalogService';
import type { SearchCar, SearchResult } from '../types/api';
import { formatLocalDateTime, pluralDays } from '../utils/format';
import { searchFromQuery } from '../utils/searchParams';

/** Step 1: every car for the dates, priced by the server and grouped by category. */
export function CarListingPage() {
  const [params] = useSearchParams();
  const { state, dispatch } = useBookingSession();
  const navigate = useNavigate();
  const criteria = useMemo(() => searchFromQuery(params) ?? state.search, [params, state.search]);

  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState<string>('all');

  const load = useCallback(() => {
    if (!criteria) return;
    setLoading(true);
    setError(null);
    dispatch({ type: 'search', search: criteria });
    catalogService
      .search(criteria)
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', errorMessage(err))))
      .finally(() => setLoading(false));
  }, [criteria, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  if (!criteria) {
    return (
      <BookingLayout step={0}>
        <Alert severity="info" action={<Button component={RouterLink} to="/">Search</Button>}>
          Start by choosing your dates and pickup location.
        </Alert>
      </BookingLayout>
    );
  }

  const select = (car: SearchCar) => {
    dispatch({ type: 'selectCar', carSlug: car.slug });
    navigate('/booking/details');
  };

  const groups = result?.categories.filter((g) => category === 'all' || g.slug === category) ?? [];
  const count = result?.categories.reduce((n, g) => n + g.cars.length, 0) ?? 0;

  return (
    <BookingLayout step={0}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
          {result ? (
            <Box>
              <Typography fontWeight={700}>
                {result.search.pickupLocation.name}
                {result.search.returnLocation.code !== result.search.pickupLocation.code && ` → ${result.search.returnLocation.name}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatLocalDateTime(result.search.pickupAt)} – {formatLocalDateTime(result.search.returnAt)} · {pluralDays(result.search.rentalDays)}
              </Typography>
            </Box>
          ) : (
            <Typography color="text.secondary">Your search</Typography>
          )}
          <Button startIcon={<EditOutlinedIcon />} variant={editing ? 'contained' : 'outlined'} onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
            Modify search
          </Button>
        </Stack>
        <Collapse in={editing} unmountOnExit>
          <Box sx={{ pt: 3 }}>
            <SearchForm initial={criteria} variant="compact" onSearched={() => setEditing(false)} />
          </Box>
        </Collapse>
      </Paper>

      {loading && <LoadingState label="Finding available cars…" />}

      {!loading && error && (
        <ErrorState
          title="We could not search with these details"
          message={error.message}
          onRetry={error.status === 0 || error.status >= 500 ? load : undefined}
          action={
            <Button color="inherit" size="small" onClick={() => setEditing(true)}>
              Change search
            </Button>
          }
        />
      )}

      {!loading && result && (
        <>
          <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto', pb: 0.5 }} role="tablist" aria-label="Filter by category">
            <Chip label={`All cars (${count})`} color={category === 'all' ? 'primary' : 'default'} onClick={() => setCategory('all')} role="tab" aria-selected={category === 'all'} />
            {result.categories.map((g) => (
              <Chip
                key={g.slug}
                label={`${g.name} (${g.cars.length})`}
                color={category === g.slug ? 'primary' : 'default'}
                onClick={() => setCategory(g.slug)}
                role="tab"
                aria-selected={category === g.slug}
              />
            ))}
          </Stack>

          {count === 0 && (
            <Alert severity="info">
              No cars can be booked online for these dates. Please <RouterLink to="/contact?type=Quote">send us a quote request</RouterLink> and we will find you a car.
            </Alert>
          )}

          <Stack spacing={5}>
            {groups.map((g) => (
              <Box component="section" key={g.slug} aria-labelledby={`cat-${g.slug}`}>
                <Typography id={`cat-${g.slug}`} variant="h3" component="h2" sx={{ mb: 2 }}>
                  {g.name}
                </Typography>
                <Grid container spacing={3}>
                  {g.cars.map((car) => (
                    <Grid key={car.slug} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <CarCard car={car} selected={state.carSlug === car.slug} onSelect={select} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </BookingLayout>
  );
}
