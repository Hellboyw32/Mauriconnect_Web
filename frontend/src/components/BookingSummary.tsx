import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Box, Button, Divider, Paper, Skeleton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { ChargeLine, Location } from '../types/api';
import { formatLocalDateTime, formatMoney, pluralDays } from '../utils/format';

export interface SummaryData {
  car: { name: string; category: string; imageUrl: string | null } | null;
  pickup: { location: Location; at: string; address?: string | null };
  return: { location: Location; at: string; address?: string | null };
  rentalDays: number;
  charges: ChargeLine[];
  subTotal: number;
  additionalCharges: number;
  total: number;
}

/** Booking summary shown next to (desktop) or below (mobile) each booking step. */
export function BookingSummary({ data, loading, onChangeCar, footer }: { data: SummaryData | null; loading?: boolean; onChangeCar?: () => void; footer?: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, position: { md: 'sticky' }, top: { md: 96 } }} aria-label="Booking summary">
      <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
        Your booking
      </Typography>
      {!data ? (
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={90} />
          <Skeleton />
          <Skeleton />
          <Skeleton width="60%" />
        </Stack>
      ) : (
        <Stack spacing={2}>
          {data.car && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Box component="img" src={data.car.imageUrl ?? '/cars/economy.svg'} alt="" sx={{ width: 104, height: 64, objectFit: 'contain', bgcolor: '#eef3f8', borderRadius: 2, p: 0.75 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700}>{data.car.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.car.category} · or similar
                </Typography>
              </Box>
              {onChangeCar && (
                <Button size="small" onClick={onChangeCar}>
                  Change
                </Button>
              )}
            </Stack>
          )}
          <Divider />
          <SummaryLeg title="Pickup" location={data.pickup.location} at={data.pickup.at} address={data.pickup.address} />
          <SummaryLeg title="Return" location={data.return.location} at={data.return.at} address={data.return.address} />
          <Typography variant="body2" color="text.secondary">
            Rental duration: <strong>{pluralDays(data.rentalDays)}</strong>
          </Typography>
          <Divider />
          <Box component="dl" sx={{ m: 0, opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
            {data.charges.map((c, i) => (
              <Row key={`${c.description}-${i}`} label={c.description} value={formatMoney(c.amount)} muted={c.type !== 'Rental'} />
            ))}
            <Divider sx={{ my: 1 }} />
            <Row label="Rental price" value={formatMoney(data.subTotal)} />
            <Row label="Additional charges" value={formatMoney(data.additionalCharges)} />
          </Box>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ bgcolor: '#eef3f8', mx: -1, px: 1.5, py: 1.25, borderRadius: 2 }}>
            <Typography fontWeight={700}>Total payable</Typography>
            <Typography variant="h4" component="p" color="primary.main">
              {formatMoney(data.total)}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Includes unlimited mileage and free delivery. A security deposit is taken when you collect the car.
          </Typography>
          {footer}
        </Stack>
      )}
    </Paper>
  );
}

function SummaryLeg({ title, location, at, address }: { title: string; location: Location; at: string; address?: string | null }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <PlaceOutlinedIcon fontSize="small" color="primary" sx={{ mt: '2px' }} />
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {location.name}
          </Typography>
          {address && (
            <Typography variant="body2" color="text.secondary">
              {address}
            </Typography>
          )}
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
        <EventOutlinedIcon fontSize="small" color="primary" />
        <Typography variant="body2">{formatLocalDateTime(at)}</Typography>
      </Stack>
    </Box>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.4 }}>
      <Typography component="dt" variant="body2" color={muted ? 'text.secondary' : 'text.primary'}>
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Stack>
  );
}
