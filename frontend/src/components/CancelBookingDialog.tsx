import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { errorMessage } from '../services/apiClient';
import { bookingService } from '../services/bookingService';
import type { Booking, CancellationQuote } from '../types/api';
import { formatMoney } from '../utils/format';

const ruleLabel = (rules: CancellationQuote['policy'], i: number) => {
  const r = rules[i];
  const prev = rules[i - 1];
  if (i === 0) return `${r.hoursBeforePickup} hours or more before pickup`;
  return r.hoursBeforePickup === 0 ? `Less than ${prev.hoursBeforePickup} hours before pickup` : `${r.hoursBeforePickup}–${prev.hoursBeforePickup} hours before pickup`;
};

/**
 * Shows the policy, fee and refund from the server before the customer confirms.
 * The server recalculates everything on confirmation; nothing here is trusted.
 */
export function CancelBookingDialog({ booking, token, open, onClose, onCancelled }: { booking: Booking; token: string; open: boolean; onClose: () => void; onCancelled: (b: Booking) => void }) {
  const [quote, setQuote] = useState<CancellationQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuote(null);
    setError(null);
    bookingService.cancellationQuote(booking.reference, token).then(setQuote).catch((err) => setError(errorMessage(err)));
  }, [open, booking.reference, token]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await bookingService.cancel(booking.reference, token, reason.trim() || null);
      onCancelled(result.booking);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby="cancel-title">
      <DialogTitle id="cancel-title">Cancel booking {booking.reference}?</DialogTitle>
      <DialogContent dividers>
        {!quote && !error && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {quote && !quote.allowed && <Alert severity="warning">{quote.reason}</Alert>}
        {quote && quote.allowed && (
          <Stack spacing={2.5}>
            {quote.paidAmount > 0 && quote.policy.length > 0 && (
              <Box>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  Cancellation policy
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>When you cancel</TableCell>
                      <TableCell align="right">Fee</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quote.policy.map((r, i) => (
                      <TableRow key={r.hoursBeforePickup} selected={r.feePercent === quote.feePercent}>
                        <TableCell>{ruleLabel(quote.policy, i)}</TableCell>
                        <TableCell align="right">{r.feePercent === 0 ? 'Free' : `${r.feePercent}% of the amount paid`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            <Box sx={{ bgcolor: '#eef3f8', p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Amount paid</Typography>
                <Typography fontWeight={600}>{formatMoney(quote.paidAmount)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Cancellation fee</Typography>
                <Typography fontWeight={600}>{formatMoney(quote.fee)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography fontWeight={700}>Refund</Typography>
                <Typography fontWeight={700} color="primary.main">
                  {formatMoney(quote.refundAmount)}
                </Typography>
              </Stack>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {quote.refundAmount > 0
                ? 'The refund goes back to your PayPal account or card. It usually appears within 5 to 10 working days, depending on your bank.'
                : quote.paidAmount > 0
                  ? 'Under the cancellation policy no refund is due for this booking.'
                  : 'You have not paid for this booking, so nothing is charged.'}
            </Typography>
            <TextField label="Reason for cancelling (optional)" value={reason} onChange={(e) => setReason(e.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 500 } }} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Keep my booking
        </Button>
        <Button variant="contained" color="error" onClick={confirm} disabled={!quote?.allowed || busy}>
          {busy ? 'Cancelling…' : 'Cancel booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
