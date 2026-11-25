import { zodResolver } from '@hookform/resolvers/zod';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { Alert, Box, Button, Container, Grid2 as Grid, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookingDetails } from '../components/BookingDetails';
import { CancelBookingDialog } from '../components/CancelBookingDialog';
import { LoadingState, PageHeader } from '../components/common';
import { company } from '../content/company';
import { useBookingSession } from '../hooks/useBookingSession';
import { ApiError, errorMessage } from '../services/apiClient';
import { bookingService } from '../services/bookingService';
import type { Booking } from '../types/api';
import { bookingTokens } from '../utils/bookingTokens';
import { lookupSchema, type LookupValues } from '../utils/validation';

/**
 * Manage My Booking: no account needed. Access needs the Booking ID plus the booking email,
 * or the secure link from the confirmation email (?ref=...&token=...).
 */
export function ManageBookingPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useBookingSession();
  const [session, setSession] = useState<{ booking: Booking; token: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { reference: params.get('ref') ?? '', email: '' },
  });

  const open = useCallback(async (reference: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      const booking = await bookingService.get(reference, token);
      bookingTokens.set(booking.reference, token);
      setSession({ booking, token });
    } catch (err) {
      bookingTokens.remove(reference);
      setError(err instanceof ApiError && err.status === 401 ? 'This link has expired. Please look up your booking with your email address.' : errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Secure link from the email, or a booking this tab already has access to.
  useEffect(() => {
    const ref = params.get('ref');
    const linkToken = params.get('token');
    if (ref && linkToken) {
      // Drop the token from the address bar so it is not kept in history or shared by accident.
      setParams({ ref }, { replace: true });
      void open(ref, linkToken);
    } else if (ref && bookingTokens.get(ref) && !session) {
      void open(ref, bookingTokens.get(ref)!);
    }
  }, [params, setParams, open, session]);

  const onLookup = async (v: LookupValues) => {
    setError(null);
    try {
      const result = await bookingService.verify(v.reference, v.email);
      bookingTokens.set(result.booking.reference, result.accessToken);
      setSession({ booking: result.booking, token: result.accessToken });
      setParams({ ref: result.booking.reference }, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const payNow = () => {
    if (!session) return;
    // Resume step 3 for this unpaid booking.
    dispatch({ type: 'reset' });
    dispatch({ type: 'bookingCreated', booking: { reference: session.booking.reference, token: session.token, fingerprint: '' } });
    navigate('/booking/payment');
  };

  const booking = session?.booking;

  return (
    <>
      <PageHeader overline="No account needed" title="Manage my booking" subtitle="View your booking, download your voucher or cancel online." />
      <Container sx={{ py: { xs: 4, md: 6 } }}>
        {loading && <LoadingState label="Opening your booking…" />}

        {!loading && !booking && (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
                <Typography variant="h4" component="h2" sx={{ mb: 0.5 }}>
                  Find your booking
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Enter the Booking ID from your confirmation email and the email address used to book.
                </Typography>
                <Box component="form" noValidate onSubmit={handleSubmit(onLookup)}>
                  <Stack spacing={2.5}>
                    <Controller
                      name="reference"
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          label="Booking ID"
                          placeholder="MC-261030-K7QM"
                          required
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          slotProps={{ htmlInput: { autoCapitalize: 'characters', spellCheck: false } }}
                        />
                      )}
                    />
                    <Controller
                      name="email"
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField {...field} type="email" label="Email address" required autoComplete="email" error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )}
                    />
                    {error && <Alert severity="error">{error}</Alert>}
                    <Button type="submit" variant="contained" size="large" startIcon={<SearchIcon />} disabled={formState.isSubmitting}>
                      {formState.isSubmitting ? 'Searching…' : 'Find my booking'}
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, bgcolor: '#eef3f8', borderColor: 'transparent' }}>
                <Typography variant="h5" component="h2">
                  Need help?
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  To change your dates or car, contact us and we will update your booking.
                </Typography>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  <Button href={company.phoneHref} variant="outlined">
                    Call {company.phone}
                  </Button>
                  <Button href={company.whatsappUrl} target="_blank" rel="noopener" variant="outlined" color="success">
                    WhatsApp us
                  </Button>
                  <Button href={`mailto:${company.email}`} variant="text">
                    {company.email}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}

        {!loading && booking && session && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
              {booking.documents.voucher && (
                <Button variant="contained" startIcon={<DownloadIcon />} href={bookingService.voucherUrl(booking.reference, session.token)}>
                  Download voucher
                </Button>
              )}
              {booking.documents.cancellation && (
                <Button variant="outlined" startIcon={<DownloadIcon />} href={bookingService.cancellationDocumentUrl(booking.reference, session.token)}>
                  Download cancellation confirmation
                </Button>
              )}
              {booking.canPay && booking.status !== 'Cancelled' && (
                <Button variant="contained" color="secondary" startIcon={<PaymentOutlinedIcon />} onClick={payNow}>
                  Complete payment
                </Button>
              )}
              {booking.canCancel && (
                <Button variant="outlined" color="error" startIcon={<CancelOutlinedIcon />} onClick={() => setCancelOpen(true)}>
                  Cancel booking
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              <Button
                onClick={() => {
                  setSession(null);
                  setParams({}, { replace: true });
                }}
              >
                Find another booking
              </Button>
            </Stack>

            {booking.status === 'Completed' && <Alert severity="info">This rental is completed. Thank you for travelling with MauriConnect.</Alert>}
            {booking.cancellation?.refundStatus === 'RefundFailed' && (
              <Alert severity="warning">Your booking is cancelled. Our team has been notified to complete your refund and will contact you shortly.</Alert>
            )}

            <BookingDetails booking={booking} />

            <CancelBookingDialog
              booking={booking}
              token={session.token}
              open={cancelOpen}
              onClose={() => setCancelOpen(false)}
              onCancelled={(b) => {
                setSession({ booking: b, token: session.token });
                setCancelOpen(false);
                setNotice('Your booking has been cancelled. A confirmation has been emailed to you.');
              }}
            />
          </Stack>
        )}
      </Container>
      <Snackbar open={!!notice} autoHideDuration={6000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </>
  );
}
