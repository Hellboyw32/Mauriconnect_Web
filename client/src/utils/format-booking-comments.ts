import type { Booking } from '@libs/types';

// Add-ons live as separate boolean columns (IsGps/IsCarSeat/IsBoosterSeat),
// not in SpecialRequest, so the daily schedule report's Comments column never
// showed them - fold them in here instead of duplicating this in both the
// on-screen grid and the PDF export.
export const getBookingComments = (booking: Booking): string => {
  const addOns: string[] = [];

  if (booking.IsGps) addOns.push('GPS');
  if (booking.IsCarSeat) addOns.push('Car Seat');
  if (booking.IsBoosterSeat) addOns.push('Booster Seat');

  const addOnsText = addOns.join(', ');
  const specialRequest = booking.SpecialRequest?.trim() || '';

  if (addOnsText && specialRequest) {
    return `${addOnsText} | ${specialRequest}`;
  }

  return addOnsText || specialRequest;
};
