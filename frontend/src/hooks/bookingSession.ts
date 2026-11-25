import type { CreateBookingRequest, SearchCriteria, SelectedExtra } from '../types/api';
import type { CustomerFormValues } from '../utils/validation';

/*
  The booking session carries the customer's choices across the three steps. It is kept in
  sessionStorage, so a page refresh or going back a step never loses what was entered, and it
  is cleared once the booking is paid. Prices are never stored here: they always come from the API.
*/

export interface CreatedBooking {
  reference: string;
  token: string;
  /** The request the booking was created from: a changed request means a new booking. */
  fingerprint: string;
}

export interface BookingSessionState {
  search: SearchCriteria | null;
  carSlug: string | null;
  extras: SelectedExtra[];
  /** What the customer typed on step 2, kept as entered (even half-finished). */
  form: Partial<CustomerFormValues> | null;
  booking: CreatedBooking | null;
  /** Idempotency key reused while the same request is retried. */
  pendingKey: { fingerprint: string; key: string } | null;
}

export type BookingSessionAction =
  | { type: 'search'; search: SearchCriteria }
  | { type: 'selectCar'; carSlug: string }
  | { type: 'extras'; extras: SelectedExtra[] }
  | { type: 'form'; values: Partial<CustomerFormValues> }
  | { type: 'pendingKey'; fingerprint: string; key: string }
  | { type: 'bookingCreated'; booking: CreatedBooking }
  | { type: 'bookingReleased' }
  | { type: 'reset' };

export const emptySession: BookingSessionState = {
  search: null,
  carSlug: null,
  extras: [],
  form: null,
  booking: null,
  pendingKey: null,
};

const sameSearch = (a: SearchCriteria | null, b: SearchCriteria) =>
  !!a && a.pickupLocation === b.pickupLocation && a.returnLocation === b.returnLocation && a.pickupAt === b.pickupAt && a.returnAt === b.returnAt;

export function bookingSessionReducer(state: BookingSessionState, action: BookingSessionAction): BookingSessionState {
  switch (action.type) {
    case 'search':
      // A new search keeps the customer's details; the chosen car only survives an identical search.
      return sameSearch(state.search, action.search) ? state : { ...state, search: action.search, carSlug: null, extras: [] };
    case 'selectCar':
      return state.carSlug === action.carSlug ? state : { ...state, carSlug: action.carSlug, extras: [] };
    case 'extras':
      return { ...state, extras: action.extras.filter((e) => e.quantity > 0) };
    case 'form':
      return { ...state, form: action.values };
    case 'pendingKey':
      return { ...state, pendingKey: { fingerprint: action.fingerprint, key: action.key } };
    case 'bookingCreated':
      return { ...state, booking: action.booking, pendingKey: null };
    case 'bookingReleased':
      return { ...state, booking: null };
    case 'reset':
      return emptySession;
  }
}

/** Stable identity of a booking request, used to decide whether an existing unpaid booking can be reused. */
export function fingerprint(request: CreateBookingRequest): string {
  const extras = [...request.extras].filter((e) => e.quantity > 0).sort((a, b) => a.code.localeCompare(b.code));
  return JSON.stringify({ ...request, extras });
}

const STORAGE_KEY = 'mauriconnect.booking.v1';

export function loadSession(storage: Storage | undefined = globalThis.sessionStorage): BookingSessionState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? { ...emptySession, ...(JSON.parse(raw) as Partial<BookingSessionState>) } : emptySession;
  } catch {
    return emptySession;
  }
}

export function saveSession(state: BookingSessionState, storage: Storage | undefined = globalThis.sessionStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or disabled (private mode): the session simply lives in memory.
  }
}
