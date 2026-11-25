import type { AppConfig, Car, Category, Extra, Location, QuoteResult, SearchCriteria, SearchResult, SelectedExtra } from '../types/api';
import { api } from './apiClient';

export const catalogService = {
  config: () => api.get<AppConfig>('/config').then((r) => r.data),
  locations: () => api.get<Location[]>('/locations').then((r) => r.data),
  categories: () => api.get<Category[]>('/cars/categories').then((r) => r.data),
  extras: () => api.get<Extra[]>('/extras').then((r) => r.data),
  car: (slug: string) => api.get<Car>(`/cars/${encodeURIComponent(slug)}`).then((r) => r.data),
  search: (criteria: SearchCriteria) => api.post<SearchResult>('/cars/search', criteria).then((r) => r.data),
  quote: (criteria: SearchCriteria, carSlug: string, extras: SelectedExtra[]) =>
    api.post<QuoteResult>('/quotes', { ...criteria, carSlug, extras }).then((r) => r.data),
};
