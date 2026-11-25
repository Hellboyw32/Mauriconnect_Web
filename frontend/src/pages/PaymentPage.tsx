import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Alert, Box, Button, Checkbox, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { BookingSummary } from '../components/BookingSummary';
import { ErrorState, LoadingState } from '../components/common';
import { PayPalPayment } from '../components/PayPalPayment';
import { useBookingSession } from '../hooks/useBookingSession';
import { useCatalog } from '../hooks/useCatalog';
import { BookingLayout } from '../layouts/BookingLayout';
import { errorMessage } from '../services/apiClient';
import { bookingService } from '../services/bookingService';
import type { Booking, CaptureResult } from '../types/api';
import { formatMoney } from '../utils/format';

function HoldTimer({ until }: { until: string }) {
  const [left, setLeft] = useState(() => Date.parse(until) - Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setLeft(Date.parse(until) - Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [until]);
  if (left <= 0) return <Alert severity="info">Your hold has ended, but you can still pay: we will check the car is still free.</Alert>;
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <Alert severity="success" icon={<TimerOutlinedIcon />}>
      We are holding this car for you for{' '}
      <strong>
        {m}:{String(s).padStart(2, '0')}
      </strong>{' '}
      minutes.
    </Alert>
  );
}

/** Step 3: pay the booking created in step 2. It is confirmed only after server-side capture. */
export function PaymentPage() {
  const { state, dispatch } = useBookingSession();
  const { config } = useCatalog();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const created = state.booking;

  const load = useCallback(() => {
    if (!created) return;
    setError(null);
    bookingService
      .get(created.reference, created.token)
      .then(setBooking)
      .catch((err) => setError(errorMessage(err)));
  }, [created]);
  useEffect(() => {
    load();
  }, [load]);

  const finish = useCallback(
    (reference: string) => {
      dispatch({ type: 'reset' });
      navigate(`/booking/confirmation/${reference}`, { replace: true });
    },
    [dispatch, navigate],
  );

  // Already paid (e.g. the page was reloaded after paying): go to the confirmation.
  useEffect(() => {
    if (booking && (booking.status === 'Confirmed' || booking.paymentStatus === 'Successful')) finish(booking.reference);
  }, [booking, finish]);

  if (!created) return <Navigate to={state.carSlug ? '/booking/details' : '/'} replace />;

  const onResult = (result: CaptureResult) => {
    setBooking(result.booking);
    if (result.outcome === 'Confirmed') finish(result.booking.reference);
    else setPending(true);
  };

  const summary = (
    <BookingSummary
      data={
        booking && {
          car: booking.car,
          pickup: booking.pickup,
          return: booking.return,
          rentalDays: booking.rentalDays,
          charges: booking.charges,
          subTotal: booking.subTotal,
          additionalCharges: booking.additionalCharges,
          total: booking.total,
        }
      }
    />
  );

  return (
    <BookingLayout step={2} summary={summary}>
      {error && <ErrorState message={error} onRetry={load} />}
      {!booking && !error && <LoadingState label="Loading your booking…" />}
      {booking && !booking.canPay && booking.status !== 'Confirmed' && (
        <ErrorState
          title="This booking can no longer be paid"
          message="The pickup time has passed or the booking was cancelled. Please start a new search."
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/" onClick={() => dispatch({ type: 'reset' })}>
              New search
            </Button>
          }
        />
      )}
      {booking && booking.canPay && (
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Typography variant="h4" component="h2">
              Payment
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Booking <strong>{booking.reference}</strong> for {booking.customer.firstName} {booking.customer.lastName}
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ my: 3, p: 2, bgcolor: '#eef3f8', borderRadius: 2 }}>
              <Typography fontWeight={700}>Amount to pay now</Typography>
              <Typography variant="h3" component="p" color="primary.main">
                {formatMoney(booking.total)}
              </Typography>
            </Stack>
            {booking.holdExpiresAt && (
              <Box sx={{ mb: 3 }}>
                <HoldTimer until={booking.holdExpiresAt} />
              </Box>
            )}
            {booking.paymentStatus === 'Failed' && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Your previous payment attempt did not go through and you were not charged. You can try again below.
              </Alert>
            )}
            {pending && (
              <Alert severity="info" sx={{ mb: 3 }}>
                PayPal is still processing your payment. We will email you as soon as it is confirmed. There is no need to pay again.
              </Alert>
            )}
            <FormControlLabel
              sx={{ mb: 2, alignItems: 'flex-start' }}
              control={<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} sx={{ mt: -0.75 }} />}
              label={
                <Typography variant="body2">
                  I have read and accept the{' '}
                  <RouterLink to="/terms" target="_blank">
                    rental terms and conditions
                  </RouterLink>{' '}
                  and the{' '}
                  <RouterLink to="/privacy" target="_blank">
                    privacy policy
                  </RouterLink>
                  .
                </Typography>
              }
            />
            {!pending && config && (
              <PayPalPayment
                reference={booking.reference}
                token={created.token}
                provider={config.paymentProvider}
                clientId={config.paypalClientId}
                disabled={!accepted}
                onResult={onResult}
              />
            )}
            {!accepted && (
              <Typography variant="caption" color="text.secondary">
                Please accept the terms to continue.
              </Typography>
            )}
          </Paper>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
            <LockOutlinedIcon fontSize="small" />
            <Typography variant="body2">Payments are processed securely by PayPal. We never see or store your card details.</Typography>
          </Stack>
          <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/booking/details')}>
              Back to your details
            </Button>
          </Box>
        </Stack>
      )}
    </BookingLayout>
  );
}
