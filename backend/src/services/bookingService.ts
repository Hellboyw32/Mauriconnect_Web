import type { BookingRecord } from '../repositories/bookingRepository';
import { isUniqueViolation, notFound, unprocessable } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateBookingReference } from '../utils/reference';
import { parseLocalDateTime } from '../utils/time';
import type { CreateBookingInput } from '../validation/schemas';
import type { BookingView } from './bookingView';
import { toBookingView } from './bookingView';
import type { CatalogService } from './catalogService';
import type { Deps } from './deps';
import type { TokenService } from './tokens';

const GENERIC_NOT_FOUND = 'We could not find a booking with these details. Check the booking reference and email address.';

export function createBookingService(deps: Deps, catalog: CatalogService, tokens: TokenService) {
  async function load(reference: string): Promise<BookingRecord> {
    const record = await deps.bookings.findByReference(reference);
    if (!record) throw notFound('BOOKING_NOT_FOUND', GENERIC_NOT_FOUND);
    return record;
  }

  return {
    load,

    async view(reference: string): Promise<BookingView> {
      return toBookingView(await load(reference), deps.clock());
    },

    /**
     * Step 2 -> creates the booking as PendingPayment and holds a car. The price is always
     * recalculated here; nothing the browser sends about money is trusted.
     */
    async create(input: CreateBookingInput, idempotencyKey: string | null, ipAddress: string | null) {
      const { itinerary, model, quote } = await catalog.quote({ ...input.search, carSlug: input.carSlug, extras: input.extras });

      const pickupAddress = input.travel.pickupAddress ?? null;
      const returnAddress = input.travel.returnAddress ?? null;
      if (itinerary.pickupLocation.requiresAddress && !pickupAddress) {
        throw unprocessable('ADDRESS_REQUIRED', 'Please tell us the hotel or address where we should deliver the car.', [
          { path: 'travel.pickupAddress', message: 'Delivery address is required.' },
        ]);
      }
      if (itinerary.returnLocation.requiresAddress && !returnAddress) {
        throw unprocessable('ADDRESS_REQUIRED', 'Please tell us the hotel or address where we should collect the car.', [
          { path: 'travel.returnAddress', message: 'Collection address is required.' },
        ]);
      }

      let arrivalUtc: Date | null = null;
      if (input.travel.arrivalAt) {
        arrivalUtc = parseLocalDateTime(input.travel.arrivalAt);
        if (!arrivalUtc) throw unprocessable('INVALID_DATE', 'Arrival date is not valid.', [{ path: 'travel.arrivalAt', message: 'Arrival date is not valid.' }]);
      }

      const params = {
        idempotencyKey,
        customer: input.customer,
        carModelId: model.id,
        pickupLocationId: itinerary.pickupLocation.id,
        returnLocationId: itinerary.returnLocation.id,
        pickupAddress: itinerary.pickupLocation.requiresAddress ? pickupAddress : null,
        returnAddress: itinerary.returnLocation.requiresAddress ? returnAddress : null,
        pickupUtc: itinerary.pickupUtc,
        returnUtc: itinerary.returnUtc,
        rentalDays: quote.rentalDays,
        subTotalCents: quote.subTotalCents,
        additionalCents: quote.additionalCents,
        totalCents: quote.totalCents,
        securityDeposit: model.securityDeposit,
        flightNumber: input.travel.flightNumber ?? null,
        arrivalUtc,
        accommodation: input.travel.accommodation ?? null,
        specialRequests: input.travel.specialRequests ?? null,
        charges: quote.lines,
        ipAddress,
      };

      let created: Awaited<ReturnType<Deps['bookings']['create']>> | null = null;
      for (let attempt = 1; attempt <= 5 && !created; attempt++) {
        try {
          created = await deps.bookings.create({ ...params, reference: generateBookingReference(deps.clock()) });
        } catch (err) {
          if (isUniqueViolation(err, 'UQ_Bookings_Reference')) continue; // reference collision: draw another
          if (isUniqueViolation(err, 'UX_Bookings_IdempotencyKey')) {
            // The same request arrived twice at the same moment: the first one won, reuse it.
            created = await deps.bookings.create({ ...params, reference: generateBookingReference(deps.clock()) });
            break;
          }
          throw err;
        }
      }
      if (!created) throw new Error('Could not allocate a unique booking reference');
      if (created.isOutsourced && !created.isExisting) logger.info({ reference: created.reference }, 'Fleet full: booking needs an outsourced car');

      return {
        booking: toBookingView(await load(created.reference), deps.clock()),
        accessToken: tokens.issueBookingToken(created.reference),
        isExisting: created.isExisting,
      };
    },

    /** Manage My Booking: reference + email must both match. The error never reveals which one was wrong. */
    async verify(reference: string, email: string) {
      const record = await deps.bookings.findByReference(reference);
      if (!record || record.customer.email.toLowerCase() !== email.toLowerCase()) throw notFound('BOOKING_NOT_FOUND', GENERIC_NOT_FOUND);
      return { accessToken: tokens.issueBookingToken(record.reference), booking: toBookingView(record, deps.clock()) };
    },

    /** The customer went back to choose another car: release the unpaid booking's hold. */
    async abandon(reference: string) {
      const record = await load(reference);
      if (record.status === 'PendingPayment') await deps.bookings.abandon(record.bookingId);
      return toBookingView(await load(reference), deps.clock());
    },

    async expireHolds() {
      return deps.bookings.expireHolds();
    },
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
