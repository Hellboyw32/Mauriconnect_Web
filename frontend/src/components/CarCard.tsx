import CheckIcon from '@mui/icons-material/Check';
import { Box, Button, Card, CardContent, CardMedia, Chip, Divider, Stack, Typography } from '@mui/material';
import type { SearchCar } from '../types/api';
import { formatMoney, formatMoneyShort, pluralDays } from '../utils/format';
import { CarFeatures } from './CarFeatures';
import { CarBadges, CarRating } from './CarRatingBadges';

export function CarCard({ car, selected, onSelect, busy }: { car: SearchCar; selected?: boolean; onSelect: (car: SearchCar) => void; busy?: boolean }) {
  const extraCharges = car.charges.filter((c) => c.type !== 'Rental' && c.type !== 'Discount');
  const discount = car.charges.find((c) => c.type === 'Discount');
  return (
    <Card
      component="article"
      aria-label={car.name}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow .2s, border-color .2s',
        borderColor: selected ? 'primary.main' : undefined,
        '&:hover': { boxShadow: '0 10px 28px rgba(16, 38, 64, 0.12)' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          background: 'radial-gradient(ellipse 60% 14% at 50% 88%, rgba(20,33,46,.18), transparent 70%), linear-gradient(180deg, #f7f9fb 0%, #e9eef4 100%)',
          pt: 5,
          pb: 1.5,
          px: 2.5,
        }}
      >
        <CardMedia
          component="img"
          image={car.imageUrl ?? '/cars/economy.svg'}
          alt={`${car.name} or similar`}
          loading="lazy"
          sx={{ height: 160, objectFit: 'contain' }}
        />
        <Chip label={car.category} size="small" color="primary" sx={{ position: 'absolute', top: 12, left: 12 }} />
        <Stack spacing={0.75} alignItems="flex-end" sx={{ position: 'absolute', top: 12, right: 12 }}>
          <CarBadges badges={car.badges} />
          {selected && <Chip icon={<CheckIcon />} label="Your choice" size="small" color="success" />}
        </Stack>
      </Box>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h3">
            {car.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or similar · {car.category}
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <CarRating rating={car.rating} />
          </Box>
        </Box>
        <CarFeatures car={car} />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" variant="outlined" color="success" label="Unlimited mileage" />
          {discount && <Chip size="small" variant="outlined" color="secondary" label={discount.description} />}
          {!car.fleetAvailable && <Chip size="small" variant="outlined" label="High demand: a similar model may be provided" />}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Divider />
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {formatMoneyShort(car.dailyRate)} / day
            </Typography>
            <Typography variant="h4" component="p" color="primary.main">
              {formatMoney(car.total)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total for {pluralDays(car.rentalDays)}
              {extraCharges.length > 0 ? `, incl. ${extraCharges.map((c) => c.description.toLowerCase()).join(', ')}` : ''}
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => onSelect(car)} disabled={busy} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            Select this car
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
