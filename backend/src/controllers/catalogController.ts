import type { CatalogService } from '../services/catalogService';
import { asyncHandler } from './asyncHandler';

export function createCatalogController(catalog: CatalogService, publicConfig: { paymentProvider: string; paypalClientId: string | null }) {
  return {
    config: asyncHandler(async (_req, res) => {
      res.json({ ...publicConfig, settings: await catalog.publicSettings() });
    }),
    locations: asyncHandler(async (_req, res) => {
      res.json(await catalog.listLocations());
    }),
    categories: asyncHandler(async (_req, res) => {
      res.json(await catalog.listCategories());
    }),
    extras: asyncHandler(async (_req, res) => {
      res.json(await catalog.listExtras());
    }),
    search: asyncHandler(async (req, res) => {
      res.json(await catalog.search(req.body));
    }),
    car: asyncHandler(async (req, res) => {
      res.json(await catalog.getCar(req.params.slug));
    }),
    quote: asyncHandler(async (req, res) => {
      res.json((await catalog.quote(req.body)).summary);
    }),
  };
}
