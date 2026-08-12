import { differenceInDays } from 'date-fns';

export type ExpiryStatus = {
  label: string;
  color: 'success' | 'warning' | 'error';
};

export const getExpiryStatus = (endDate?: string | null): ExpiryStatus => {
  if (!endDate) {
    return { label: 'Unknown', color: 'warning' };
  }

  const daysUntilEnd = differenceInDays(new Date(endDate), new Date());

  if (daysUntilEnd < 0) {
    return { label: 'Expired', color: 'error' };
  }

  if (daysUntilEnd <= 30) {
    return { label: 'Expiring Soon', color: 'warning' };
  }

  return { label: 'Active', color: 'success' };
};
