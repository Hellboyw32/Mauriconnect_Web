import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { Alert, Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { BookingDetails } from '../components/BookingDetails';
import { ErrorState, LoadingState } from '../components/common';
import { company, rentalTerms } from '../content/company';
import { errorMessage } from '../services/apiClient';
import { bookingService } from '../services/bookingService';
import type { Booking } from '../types/api';
import { bookingTokens } from '../utils/bookingTokens';

export function ConfirmationPage() {
  const { reference = '' } = useParams();
  const token = bookingTokens.get(reference);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    bookingService.get(reference, token).then(setBooking).catch((err) => setError(errorMessage(err)));
  }, [reference, token]);
  useEffect(() => {
    load();
  }, [load]);

  // A capture still being processed by PayPal: check again every few seconds.
  useEffect(() => {
    if (!booking || booking.status !== 'PendingPayment') return;
    const t = window.setTimeout(load, 5000);
    return () => window.clearTimeout(t);
  }, [booking, load]);

  if (!token) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="info" action={<Button component={RouterLink} to={`/manage-booking?ref=${encodeURIComponent(reference)}`}>Look it up</Button>}>
          To see booking {reference}, look it up with your email address.
        </Alert>
      </Container>
    );
  }

  const confirmed = booking && ['Confirmed', 'InProgress', 'Completed'].includes(booking.status);

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      <Container sx={{ py: { xs: 4, md: 6 } }}>
        {error && <ErrorState message={error} onRetry={load} />}
        {!booking && !error && <LoadingState label="Loading your booking…" />}
        {booking && (
          <Stack spacing={3}>
            <Paper sx={{ p: { xs: 3, md: 4 }, textAlign: 'center', borderTop: 4, borderColor: confirmed ? 'success.main' : 'warning.main' }} variant="outlined">
              {confirmed ? <CheckCircleIcon color="success" sx={{ fontSize: 64 }} /> : <HourglassTopIcon color="warning" sx={{ fontSize: 64 }} />}
              <Typography variant="h2" component="h1" sx={{ mt: 1 }}>
                {confirmed ? 'Your booking is confirmed' : 'We are confirming your payment'}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 620, mx: 'auto' }}>
                {confirmed
                  ? `Thank you, ${booking.customer.firstName}. We have emailed your voucher to ${booking.customer.email}. Please bring it with your passport and driving licence.`
                  : 'PayPal is still processing your payment. This page updates automatically, and we will email you once it is confirmed.'}
              </Typography>
              {confirmed && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
                  <Button variant="contained" size="large" startIcon={<DownloadIcon />} href={bookingService.voucherUrl(booking.reference, token)}>
                    Download voucher (PDF)
                  </Button>
                  <Button variant="outlined" size="large" component={RouterLink} to={`/manage-booking?ref=${booking.reference}`}>
                    Manage booking
                  </Button>
                </Stack>
              )}
            </Paper>

            <BookingDetails booking={booking} />

            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                Before you go
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary', '& li': { mb: 0.75 } }}>
                <li>Bring your voucher, passport or ID card and your driving licence.</li>
                <li>A security deposit is taken when you collect the car.</li>
                <li>{rentalTerms[1].points[1]}</li>
                <li>
                  Questions or a delayed flight? Call or WhatsApp us on {company.phone}, day or night.
                </li>
              </Box>
            </Paper>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
