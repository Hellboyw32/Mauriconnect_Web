import { Box, Container, Grid2 as Grid } from '@mui/material';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingStepper } from '../components/BookingStepper';
import { useBookingSession } from '../hooks/useBookingSession';
import { searchToQuery } from '../utils/searchParams';

/** Shared frame for the booking steps: progress indicator, main column and a summary column. */
export function BookingLayout({ step, children, summary }: { step: 0 | 1 | 2; children: ReactNode; summary?: ReactNode }) {
  const { state } = useBookingSession();
  const navigate = useNavigate();
  const goTo = (i: number) => {
    if (i === 0 && state.search) navigate(`/booking/cars?${searchToQuery(state.search)}`);
    if (i === 1) navigate('/booking/details');
  };
  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md">
          <BookingStepper active={step} onStepClick={goTo} />
        </Container>
      </Box>
      <Container sx={{ py: { xs: 3, md: 5 } }}>
        {summary ? (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>{children}</Grid>
            <Grid size={{ xs: 12, md: 4 }}>{summary}</Grid>
          </Grid>
        ) : (
          children
        )}
      </Container>
    </Box>
  );
}
