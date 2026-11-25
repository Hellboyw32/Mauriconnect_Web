import type { CountryCode } from 'libphonenumber-js';
import type { CreateBookingRequest, SearchCriteria, SelectedExtra } from '../types/api';
import { joinPhone } from './countries';
import { combine } from './datetime';
import type { CustomerFormValues } from './validation';

const orNull = (v: string | undefined | null) => (v && v.trim() ? v.trim() : null);

/** Builds the API request from the step-2 form. Contains no prices: the server calculates them. */
export function buildBookingRequest(
  search: SearchCriteria,
  carSlug: string,
  extras: SelectedExtra[],
  v: CustomerFormValues,
  needs: { pickupAddress: boolean; returnAddress: boolean },
): CreateBookingRequest {
  return {
    search,
    carSlug,
    extras: extras.filter((e) => e.quantity > 0),
    customer: {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim().toLowerCase(),
      mobileNumber: joinPhone(v.phoneCountry as CountryCode, v.phoneNational),
      country: v.country,
      nationality: v.nationality,
      address: v.address.trim(),
      city: v.city.trim(),
      postalCode: v.postalCode.trim(),
      drivingLicenceNumber: orNull(v.drivingLicenceNumber),
    },
    travel: {
      flightNumber: orNull(v.flightNumber)?.toUpperCase() ?? null,
      arrivalAt: v.arrivalDate && v.arrivalTime ? combine(v.arrivalDate, v.arrivalTime) : null,
      accommodation: orNull(v.accommodation),
      pickupAddress: needs.pickupAddress ? orNull(v.pickupAddress) : null,
      returnAddress: needs.returnAddress ? orNull(v.returnAddress) : null,
      specialRequests: orNull(v.specialRequests),
    },
  };
}
