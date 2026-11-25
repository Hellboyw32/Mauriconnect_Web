import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Chip, Rating, Stack, Tooltip, Typography } from '@mui/material';
import type { Badge, CarRating as CarRatingData } from '../types/api';

const BADGES: Record<Badge, { label: string; icon: React.ReactElement; color: 'secondary' | 'success'; title: string }> = {
  MostRented: { label: 'Most rented', icon: <TrendingUpIcon />, color: 'secondary', title: 'Our most booked car over the last 12 months' },
  MostLiked: { label: 'Most liked', icon: <FavoriteIcon />, color: 'success', title: 'Best average rating from our renters' },
};

export function CarBadges({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <Stack direction="row" spacing={0.75}>
      {badges.map((b) => (
        <Tooltip key={b} title={BADGES[b].title}>
          <Chip size="small" icon={BADGES[b].icon} label={BADGES[b].label} color={BADGES[b].color} sx={{ boxShadow: '0 2px 6px rgba(0,0,0,.15)' }} />
        </Tooltip>
      ))}
    </Stack>
  );
}

/** Stars, average and number of ratings. Demo ratings are labelled as such. */
export function CarRating({ rating }: { rating: CarRatingData | null }) {
  if (!rating) return null;
  const label = `Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} ratings`;
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" aria-label={label} role="img">
      <Rating value={rating.average} precision={0.1} readOnly size="small" aria-hidden />
      <Typography variant="body2" fontWeight={700}>
        {rating.average.toFixed(1)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        ({rating.count} ratings)
      </Typography>
      {rating.sample && (
        <Tooltip title="Sample ratings for development and demos. Real ratings come from customers after their rental.">
          <Chip size="small" variant="outlined" color="warning" label="Demo ratings" sx={{ height: 20, fontSize: '0.7rem' }} />
        </Tooltip>
      )}
    </Stack>
  );
}
