import type { SearchCriteria } from '../types/api';

const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Search criteria live in the URL of step 1, so results can be refreshed, bookmarked and shared. */
export function searchToQuery(c: SearchCriteria): string {
  return new URLSearchParams({ from: c.pickupLocation, to: c.returnLocation, pickup: c.pickupAt, return: c.returnAt }).toString();
}

export function searchFromQuery(params: URLSearchParams): SearchCriteria | null {
  const c = { pickupLocation: params.get('from') ?? '', returnLocation: params.get('to') ?? '', pickupAt: params.get('pickup') ?? '', returnAt: params.get('return') ?? '' };
  return c.pickupLocation && c.returnLocation && LOCAL.test(c.pickupAt) && LOCAL.test(c.returnAt) ? c : null;
}
