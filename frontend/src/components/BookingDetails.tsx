import { Box, Chip, Divider, Grid2 as Grid, Paper, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { Booking } from '../types/api';
import { countryName } from '../utils/countries';
import { BOOKING_STATUS_LABEL, formatLocalDateTime, formatMoney, PAYMENT_STATUS_LABEL, pluralDays, REFUND_STATUS_LABEL } from '../utils/format';
import { CarFeatures } from './CarFeatures';

export function StatusChip({ status }: { status: Booking['status'] }) {
  const s = BOOKING_STATUS_LABEL[status] ?? { label: status, color: 'default' as const };
  return <Chip label={s.label} color={s.color} />;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, height: '100%' }}>
      <Typography variant="h5" component="h3" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <Box sx={{ py: 0.5 }}>
      <Typography variant="caption" color="text.secondary" component="dt">
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0 }}>
        {children}
      </Typography>
    </Box>
  );
}

/** Full read-only view of a booking: used by the confirmation page and Manage My Booking. */
export function BookingDetails({ booking }: { booking: Booking }) {
  const c = booking.customer;
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Booking ID
            </Typography>
            <Typography variant="h3" component="p" sx={{ fontFamily: 'ui-monospace, Consolas, monospace', letterSpacing: '0.04em' }}>
              {booking.reference}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <StatusChip status={booking.status} />
            <Chip variant="outlined" label={`Payment: ${PAYMENT_STATUS_LABEL[booking.paymentStatus] ?? booking.paymentStatus}`} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Block title="Vehicle">
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box component="img" src={booking.car.imageUrl ?? '/cars/economy.svg'} alt="" sx={{ width: 132, height: 80, objectFit: 'contain', bgcolor: '#eef3f8', borderRadius: 2, p: 1 }} />
              <Box>
                <Typography fontWeight={700}>{booking.car.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {booking.car.category} · or similar
                </Typography>
              </Box>
            </Stack>
            <CarFeatures car={booking.car} />
          </Block>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Block title="Rental">
            <Box component="dl" sx={{ m: 0 }}>
              <Field label="Pickup">
                {formatLocalDateTime(booking.pickup.at)} · {booking.pickup.location.name}
                {booking.pickup.address ? ` · ${booking.pickup.address}` : ''}
              </Field>
              <Field label="Return">
                {formatLocalDateTime(booking.return.at)} · {booking.return.location.name}
                {booking.return.address ? ` · ${booking.return.address}` : ''}
              </Field>
              <Field label="Rental duration">{pluralDays(booking.rentalDays)}</Field>
              <Field label="Flight">{[booking.travel.flightNumber, booking.travel.arrivalAt && `arriving ${formatLocalDateTime(booking.travel.arrivalAt)}`].filter(Boolean).join(', ')}</Field>
              <Field label="Accommodation">{booking.travel.accommodation}</Field>
              <Field label="Special requests">{booking.travel.specialRequests}</Field>
            </Box>
          </Block>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Block title="Main driver">
            <Box component="dl" sx={{ m: 0 }}>
              <Field label="Name">
                {c.firstName} {c.lastName}
              </Field>
              <Field label="Email">{c.email}</Field>
              <Field label="Mobile">{c.mobileNumber}</Field>
              <Field label="Address">
                {c.address}, {c.postalCode} {c.city}, {countryName(c.country)}
              </Field>
              <Field label="Nationality">{countryName(c.nationality)}</Field>
              <Field label="Driving licence">{c.drivingLicenceNumber}</Field>
            </Box>
          </Block>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Block title="Price and payment">
            <Table size="small" aria-label="Charges">
              <TableBody>
                {booking.charges.map((line, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ pl: 0 }}>{line.description}</TableCell>
                    <TableCell align="right" sx={{ pr: 0, whiteSpace: 'nowrap' }}>
                      {formatMoney(line.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ pl: 0, fontWeight: 700, borderBottom: 0 }}>Total</TableCell>
                  <TableCell align="right" sx={{ pr: 0, fontWeight: 700, borderBottom: 0 }}>
                    {formatMoney(booking.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {booking.payment && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Box component="dl" sx={{ m: 0 }}>
                  <Field label="Payment status">{PAYMENT_STATUS_LABEL[booking.payment.status] ?? booking.payment.status}</Field>
                  {booking.payment.paidAt && <Field label="Amount paid">{`${formatMoney(booking.payment.amount)} on ${formatLocalDateTime(booking.payment.paidAt)}`}</Field>}
                  <Field label="Payment reference">{booking.payment.transactionId}</Field>
                  {booking.payment.refundAmount > 0 && <Field label="Refunded">{formatMoney(booking.payment.refundAmount)}</Field>}
                </Box>
              </>
            )}
            {booking.securityDeposit !== null && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Security deposit at pickup: {formatMoney(booking.securityDeposit)}
              </Typography>
            )}
          </Block>
        </Grid>
        {booking.cancellation && (
          <Grid size={12}>
            <Block title="Cancellation">
              <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { sm: 'repeat(3, 1fr)' }, columnGap: 3 }}>
                <Field label="Cancelled on">{formatLocalDateTime(booking.cancellation.cancelledAt)}</Field>
                <Field label="Cancellation fee">{`${formatMoney(booking.cancellation.fee)}${booking.cancellation.feePercent ? ` (${booking.cancellation.feePercent}%)` : ''}`}</Field>
                <Field label="Refund">{`${formatMoney(booking.cancellation.refundAmount)} · ${REFUND_STATUS_LABEL[booking.cancellation.refundStatus]}`}</Field>
                <Field label="Refund reference">{booking.cancellation.refundReference}</Field>
                <Field label="Reason">{booking.cancellation.reason}</Field>
              </Box>
            </Block>
          </Grid>
        )}
      </Grid>
    </Stack>
  );
}
