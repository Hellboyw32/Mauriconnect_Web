import type { BusinessSettings, CancellationRule, CarModel, Extra, Location, Quote } from '../types/domain';
import { badRequest, notFound, unprocessable } from '../utils/errors';
import { fromCents } from '../utils/money';
import { addDaysToDate, localDate, parseLocalDateTime, toLocalIso } from '../utils/time';
import type { SearchInput } from '../validation/schemas';
import type { Deps } from './deps';
import { computeHighlights, type CarHighlights } from './highlights';
import { calculateQuote, calculateRentalDays } from './pricing';

export interface Itinerary {
  pickupLocation: Location;
  returnLocation: Location;
  pickupUtc: Date;
  returnUtc: Date;
  rentalDays: number;
  settings: BusinessSettings;
}

const MAX_ADVANCE_DAYS = 548;

export const publicLocation = (l: Location) => ({
  code: l.code,
  name: l.name,
  type: l.type,
  address: l.address,
  deliveryFee: l.deliveryFee,
  requiresAddress: l.requiresAddress,
});

export const publicCar = (m: CarModel) => ({
  slug: m.slug,
  name: m.name,
  description: m.description,
  category: m.categoryName,
  categorySlug: m.categorySlug,
  imageUrl: m.imageUrl,
  transmission: m.transmission,
  fuelType: m.fuelType,
  passengers: m.passengers,
  doors: m.doors,
  luggage: m.luggage,
  airConditioning: m.airConditioning,
  securityDeposit: m.securityDeposit,
});

export const publicQuote = (q: Quote) => ({
  rentalDays: q.rentalDays,
  dailyRate: fromCents(q.dailyRateCents),
  subTotal: fromCents(q.subTotalCents),
  additionalCharges: fromCents(q.additionalCents),
  total: fromCents(q.totalCents),
  currency: 'EUR',
  charges: q.lines.map((l) => ({ type: l.type, description: l.description, quantity: l.quantity, amount: fromCents(l.amountCents) })),
});

export function createCatalogService(deps: Deps) {
  const cache = new Map<string, { at: number; value: unknown }>();
  async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = cache.get(key);
    const ttl = deps.config.cacheSeconds * 1000;
    if (hit && ttl > 0 && Date.now() - hit.at < ttl) return hit.value as T;
    const value = await load();
    cache.set(key, { at: Date.now(), value });
    return value;
  }

  const getSettings = () => cached('settings', () => deps.catalog.getSettings());
  const getLocations = () => cached('locations', () => deps.catalog.getLocations());
  const getExtras = () => cached('extras', () => deps.catalog.getExtras());
  const getCategories = () => cached('categories', () => deps.catalog.getCategories());
  const getCancellationRules = (): Promise<CancellationRule[]> => cached('cancellation', () => deps.catalog.getCancellationRules());
  const getHighlights = () => cached('highlights', async () => computeHighlights(await deps.catalog.getModelStats(deps.config.showSampleReviews)));
  const NO_HIGHLIGHTS: CarHighlights = { rating: null, badges: [] };

  /** Validates locations, dates and rental length against the business rules. */
  async function resolveItinerary(input: SearchInput): Promise<Itinerary> {
    const [locations, settings] = await Promise.all([getLocations(), getSettings()]);
    const pickupLocation = locations.find((l) => l.code === input.pickupLocation);
    const returnLocation = locations.find((l) => l.code === input.returnLocation);
    if (!pickupLocation) throw badRequest('INVALID_LOCATION', 'Unknown pickup location.', [{ path: 'pickupLocation', message: 'Unknown pickup location.' }]);
    if (!returnLocation) throw badRequest('INVALID_LOCATION', 'Unknown return location.', [{ path: 'returnLocation', message: 'Unknown return location.' }]);

    const pickupUtc = parseLocalDateTime(input.pickupAt);
    const returnUtc = parseLocalDateTime(input.returnAt);
    if (!pickupUtc) throw badRequest('INVALID_DATE', 'Pickup date is not valid.', [{ path: 'pickupAt', message: 'Pickup date is not valid.' }]);
    if (!returnUtc) throw badRequest('INVALID_DATE', 'Return date is not valid.', [{ path: 'returnAt', message: 'Return date is not valid.' }]);
    if (returnUtc <= pickupUtc) {
      throw unprocessable('RETURN_BEFORE_PICKUP', 'The return date and time must be after pickup.', [{ path: 'returnAt', message: 'Return must be after pickup.' }]);
    }

    const now = deps.clock();
    const earliest = new Date(now.getTime() + settings.minLeadHours * 3_600_000);
    if (pickupUtc < earliest) {
      throw unprocessable('PICKUP_TOO_SOON', `Online bookings need at least ${settings.minLeadHours} hours' notice. For an earlier pickup please contact us by phone or WhatsApp.`, [
        { path: 'pickupAt', message: `Pickup must be at least ${settings.minLeadHours} hours from now.` },
      ]);
    }
    if (pickupUtc.getTime() > now.getTime() + MAX_ADVANCE_DAYS * 86_400_000) {
      throw unprocessable('PICKUP_TOO_FAR', 'Bookings can be made up to 18 months in advance.', [{ path: 'pickupAt', message: 'Pickup is too far in the future.' }]);
    }

    const rentalDays = calculateRentalDays(pickupUtc, returnUtc, settings.graceMinutes);
    if (rentalDays < settings.minRentalDays) {
      throw unprocessable(
        'RENTAL_TOO_SHORT',
        `The minimum rental is ${settings.minRentalDays} days. For a shorter rental please send us a quote request.`,
        [{ path: 'returnAt', message: `Minimum rental is ${settings.minRentalDays} days.` }],
      );
    }
    if (rentalDays > settings.maxRentalDays) {
      throw unprocessable('RENTAL_TOO_LONG', `Online bookings are limited to ${settings.maxRentalDays} days. Please contact us for long-term rentals.`, [
        { path: 'returnAt', message: `Maximum rental is ${settings.maxRentalDays} days.` },
      ]);
    }
    return { pickupLocation, returnLocation, pickupUtc, returnUtc, rentalDays, settings };
  }

  function resolveExtras(requested: { code: string; quantity: number }[], extras: Extra[]) {
    const merged = new Map<string, number>();
    for (const r of requested) if (r.quantity > 0) merged.set(r.code, (merged.get(r.code) ?? 0) + r.quantity);
    return [...merged.entries()].map(([code, quantity]) => {
      const extra = extras.find((e) => e.code === code);
      if (!extra) throw badRequest('INVALID_EXTRA', `Unknown extra: ${code}.`, [{ path: 'extras', message: `Unknown extra: ${code}.` }]);
      if (quantity > extra.maxQuantity) {
        throw badRequest('INVALID_EXTRA', `You can add at most ${extra.maxQuantity} × ${extra.name}.`, [{ path: 'extras', message: `Maximum ${extra.maxQuantity}.` }]);
      }
      return { extra, quantity };
    });
  }

  async function pricingFor(itinerary: Itinerary, modelIds: number[]) {
    // Ranges for every local date the rental touches.
    const from = localDate(itinerary.pickupUtc);
    const to = addDaysToDate(from, itinerary.rentalDays);
    return deps.catalog.getPricing(from, to, modelIds);
  }

  const searchSummary = (it: Itinerary) => ({
    pickupLocation: publicLocation(it.pickupLocation),
    returnLocation: publicLocation(it.returnLocation),
    pickupAt: toLocalIso(it.pickupUtc),
    returnAt: toLocalIso(it.returnUtc),
    rentalDays: it.rentalDays,
  });

  return {
    getSettings,
    getCancellationRules,
    resolveItinerary,
    publicLocation,

    async listLocations() {
      return (await getLocations()).map(publicLocation);
    },

    async listCategories() {
      return (await getCategories()).map((c) => ({ name: c.name, slug: c.slug, description: c.description }));
    },

    async listExtras() {
      return (await getExtras()).map((e) => ({
        code: e.code,
        name: e.name,
        description: e.description,
        pricingType: e.pricingType,
        price: e.price,
        maxCharge: e.maxCharge,
        maxQuantity: e.maxQuantity,
      }));
    },

    async publicSettings() {
      const s = await getSettings();
      return {
        minRentalDays: s.minRentalDays,
        maxRentalDays: s.maxRentalDays,
        minLeadHours: s.minLeadHours,
        openingTime: s.openingTime,
        closingTime: s.closingTime,
        holdMinutes: s.holdMinutes,
        currency: 'EUR',
        timeZone: 'Indian/Mauritius',
      };
    },

    async getCar(slug: string) {
      const model = await deps.catalog.getModelBySlug(slug);
      if (!model) throw notFound('CAR_NOT_FOUND', 'Car not found.');
      return { ...publicCar(model), ...((await getHighlights()).get(model.id) ?? NO_HIGHLIGHTS) };
    },

    /** Step 1: every bookable car for the itinerary, priced and grouped by category. */
    async search(input: SearchInput) {
      const itinerary = await resolveItinerary(input);
      const [models, highlights] = await Promise.all([deps.catalog.searchModels(itinerary.pickupUtc, itinerary.returnUtc), getHighlights()]);
      const { ranges, discounts } = await pricingFor(itinerary, models.map((m) => m.id));

      const groups = new Map<string, { name: string; slug: string; order: number; cars: unknown[] }>();
      for (const model of models) {
        const quote = calculateQuote({
          carModelId: model.id,
          pickupUtc: itinerary.pickupUtc,
          returnUtc: itinerary.returnUtc,
          ranges,
          discounts,
          pickupLocation: itinerary.pickupLocation,
          returnLocation: itinerary.returnLocation,
          extras: [],
          settings: itinerary.settings,
        });
        if (!quote) continue; // no rate for these dates: not bookable online
        const group = groups.get(model.categorySlug) ?? { name: model.categoryName, slug: model.categorySlug, order: model.categoryOrder, cars: [] };
        group.cars.push({ ...publicCar(model), ...publicQuote(quote), ...(highlights.get(model.id) ?? NO_HIGHLIGHTS), fleetAvailable: model.freeUnits > 0 });
        groups.set(model.categorySlug, group);
      }

      return {
        search: searchSummary(itinerary),
        categories: [...groups.values()].sort((a, b) => a.order - b.order).map(({ name, slug, cars }) => ({ name, slug, cars })),
      };
    },

    /** Price of one car with extras. Used by the booking steps and by booking creation. */
    async quote(input: SearchInput & { carSlug: string; extras: { code: string; quantity: number }[] }) {
      const itinerary = await resolveItinerary(input);
      const model = await deps.catalog.getModelBySlug(input.carSlug);
      if (!model) throw notFound('CAR_NOT_FOUND', 'This car is no longer available. Please choose another car.');
      const extras = resolveExtras(input.extras, await getExtras());
      const { ranges, discounts } = await pricingFor(itinerary, [model.id]);
      const quote = calculateQuote({
        carModelId: model.id,
        pickupUtc: itinerary.pickupUtc,
        returnUtc: itinerary.returnUtc,
        ranges,
        discounts,
        pickupLocation: itinerary.pickupLocation,
        returnLocation: itinerary.returnLocation,
        extras,
        settings: itinerary.settings,
      });
      if (!quote) throw unprocessable('CAR_NOT_PRICED', 'This car cannot be booked online for these dates. Please send us a quote request.');
      return { itinerary, model, quote, summary: { search: searchSummary(itinerary), car: publicCar(model), price: publicQuote(quote) } };
    },
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
