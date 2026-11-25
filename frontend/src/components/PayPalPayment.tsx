import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { ApiError, errorMessage } from '../services/apiClient';
import { paymentService } from '../services/bookingService';
import type { CaptureResult } from '../types/api';

interface Props {
  reference: string;
  token: string;
  provider: 'paypal' | 'fake';
  clientId: string | null;
  disabled: boolean;
  onResult: (result: CaptureResult) => void;
}

/*
  The browser only approves the payment. The order is created and captured by our server,
  which checks the amount and currency before confirming the booking.
*/
export function PayPalPayment(props: Props) {
  if (props.provider === 'fake') return <SimulatedPayment {...props} />;
  if (!props.clientId) return <Alert severity="error">Online payment is not configured. Please contact us to complete your booking.</Alert>;
  return (
    <PayPalScriptProvider options={{ clientId: props.clientId, currency: 'EUR', intent: 'capture', components: 'buttons', disableFunding: 'paylater' }}>
      <PayPalButtonsBlock {...props} />
    </PayPalScriptProvider>
  );
}

function PayPalButtonsBlock({ reference, token, disabled, onResult }: Props) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  if (isRejected) return <Alert severity="error">PayPal could not be loaded. Check your connection or disable any ad blocker, then refresh the page.</Alert>;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {(isPending || processing) && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} role="status">
          <CircularProgress size={20} />
          <Typography>{processing ? 'Confirming your payment… please do not close this page.' : 'Loading PayPal…'}</Typography>
        </Stack>
      )}
      <Box sx={{ opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? 'none' : 'auto' }} aria-disabled={disabled}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', label: 'pay', height: 48 }}
          disabled={disabled || processing}
          forceReRender={[reference, disabled]}
          createOrder={async () => {
            setError(null);
            try {
              return (await paymentService.createOrder(reference, token)).orderId;
            } catch (err) {
              setError(errorMessage(err));
              throw err;
            }
          }}
          onApprove={async (data) => {
            setProcessing(true);
            try {
              onResult(await paymentService.captureOrder(reference, token, data.orderID));
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'We could not confirm the payment. You have not been charged; please try again.');
            } finally {
              setProcessing(false);
            }
          }}
          onCancel={() => setError('Payment cancelled. Your car is still held for you, you can try again.')}
          onError={() => setError((e) => e ?? 'PayPal reported an error. You have not been charged; please try again.')}
        />
      </Box>
    </Box>
  );
}

/** Development only: the backend's fake provider captures without a PayPal window. */
function SimulatedPayment({ reference, token, disabled, onResult }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const { orderId } = await paymentService.createOrder(reference, token);
      onResult(await paymentService.captureOrder(reference, token, orderId));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Stack spacing={2}>
      <Alert severity="info">Development mode: payments are simulated, no money is taken.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" size="large" onClick={pay} disabled={disabled || busy}>
        {busy ? 'Processing…' : 'Simulate successful payment'}
      </Button>
    </Stack>
  );
}
