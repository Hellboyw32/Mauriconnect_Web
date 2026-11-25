import type { BusinessSettings, CancellationRule, CarModel, Category, DurationDiscount, Extra, Location, ModelStats, PricingRange } from '../types/domain';
import { request, sql, toIsoDate, toNullableNumber, toNumber } from './db';

type Row = Record<string, unknown>;

const mapModel = (r: Row): CarModel => ({
  id: r.CarModelId as number,
  slug: r.Slug as string,
  name: r.ModelName as string,
  description: (r.Description as string) ?? null,
  categoryName: r.CategoryName as string,
  categorySlug: r.CategorySlug as string,
  categoryOrder: toNumber(r.CategoryOrder),
  transmission: r.Transmission as string,
  fuelType: r.FuelType as string,
  passengers: toNumber(r.PassengerCapacity),
  doors: toNumber(r.DoorCount),
  luggage: toNumber(r.LuggageCapacity),
  airConditioning: Boolean(r.HasAirConditioning),
  imageUrl: (r.ImageUrl as string) ?? null,
  securityDeposit: toNullableNumber(r.SecurityDeposit),
  displayOrder: toNumber(r.DisplayOrder),
});

export const catalogRepository = {
  async getCategories(): Promise<Category[]> {
    const r = await (await request()).query(
      `SELECT CarCategoryId, CategoryName, Slug, Description, DisplayOrder
       FROM rental.CarCategories WHERE IsActive = 1 ORDER BY DisplayOrder, CategoryName`,
    );
    return r.recordset.map((x) => ({
      id: x.CarCategoryId,
      name: x.CategoryName,
      slug: x.Slug,
      description: x.Description ?? null,
      displayOrder: x.DisplayOrder,
    }));
  },

  async getLocations(): Promise<Location[]> {
    const r = await (await request()).query(
      `SELECT LocationId, Code, LocationName, LocationType, Address, DeliveryFee, RequiresAddress
       FROM rental.RentalLocations WHERE IsActive = 1 ORDER BY DisplayOrder, LocationName`,
    );
    return r.recordset.map((x) => ({
      id: x.LocationId,
      code: x.Code,
      name: x.LocationName,
      type: x.LocationType,
      address: x.Address ?? null,
      deliveryFee: toNumber(x.DeliveryFee),
      requiresAddress: Boolean(x.RequiresAddress),
    }));
  },

  async getExtras(): Promise<Extra[]> {
    const r = await (await request()).query(
      `SELECT ExtraId, Code, Name, Description, PricingType, Price, MaxCharge, MaxQuantity
       FROM rental.Extras WHERE IsActive = 1 ORDER BY DisplayOrder, Name`,
    );
    return r.recordset.map((x) => ({
      id: x.ExtraId,
      code: x.Code,
      name: x.Name,
      description: x.Description ?? null,
      pricingType: x.PricingType,
      price: toNumber(x.Price),
      maxCharge: toNullableNumber(x.MaxCharge),
      maxQuantity: toNumber(x.MaxQuantity),
    }));
  },

  async getSettings(): Promise<BusinessSettings> {
    const r = await (await request()).query('SELECT SettingKey, SettingValue FROM rental.Settings');
    const map = new Map<string, string>(r.recordset.map((x) => [x.SettingKey, x.SettingValue]));
    const num = (key: string, fallback: number) => {
      const v = Number(map.get(key));
      return Number.isFinite(v) ? v : fallback;
    };
    return {
      minRentalDays: num('MinRentalDays', 3),
      maxRentalDays: num('MaxRentalDays', 90),
      graceMinutes: num('GraceMinutes', 59),
      holdMinutes: num('HoldMinutes', 30),
      minLeadHours: num('MinLeadHours', 24),
      openingTime: map.get('OpeningTime') ?? '08:00',
      closingTime: map.get('ClosingTime') ?? '18:00',
      outOfHoursFee: num('OutOfHoursFee', 0),
    };
  },

  async getCancellationRules(): Promise<CancellationRule[]> {
    const r = await (await request()).query(
      `SELECT r.PolicyId, r.HoursBeforePickup, r.FeePercent
       FROM rental.CancellationPolicyRules r
       JOIN rental.CancellationPolicies p ON p.PolicyId = r.PolicyId AND p.IsActive = 1`,
    );
    return r.recordset.map((x) => ({ policyId: x.PolicyId, hoursBeforePickup: toNumber(x.HoursBeforePickup), feePercent: toNumber(x.FeePercent) }));
  },

  /** Active models with the number of free fleet cars in the period. */
  async searchModels(pickupUtc: Date, returnUtc: Date): Promise<(CarModel & { freeUnits: number })[]> {
    const r = await (await request())
      .input('PickupUtc', sql.DateTime2(0), pickupUtc)
      .input('ReturnUtc', sql.DateTime2(0), returnUtc)
      .execute('rental.usp_SearchAvailableModels');
    return (r.recordset as Row[]).map((x) => ({ ...mapModel(x), freeUnits: toNumber(x.FreeUnits) }));
  },

  /** Published ratings (sample ones only when asked) and confirmed rentals in the last 12 months, per active model. */
  async getModelStats(includeSample: boolean): Promise<ModelStats[]> {
    const r = await (await request()).input('IncludeSample', sql.Bit, includeSample).query(`
      SELECT m.CarModelId, rv.ReviewCount, rv.AverageRating, rv.SampleReviewCount, bk.RentalsLastYear
      FROM rental.CarModels m
      OUTER APPLY (
        SELECT COUNT(*) AS ReviewCount, AVG(CAST(Rating AS decimal(5,2))) AS AverageRating, SUM(CAST(IsSample AS int)) AS SampleReviewCount
        FROM rental.CarReviews
        WHERE CarModelId = m.CarModelId AND IsPublished = 1 AND (IsSample = 0 OR @IncludeSample = 1)) rv
      OUTER APPLY (
        SELECT COUNT(*) AS RentalsLastYear
        FROM rental.Bookings
        WHERE CarModelId = m.CarModelId AND BookingStatus IN ('Confirmed', 'InProgress', 'Completed')
          AND CreatedAtUtc >= DATEADD(DAY, -365, SYSUTCDATETIME())) bk
      WHERE m.IsActive = 1`);
    return (r.recordset as Row[]).map((x) => ({
      carModelId: x.CarModelId as number,
      reviewCount: toNumber(x.ReviewCount),
      averageRating: toNullableNumber(x.AverageRating),
      sampleReviewCount: toNumber(x.SampleReviewCount),
      rentalsLastYear: toNumber(x.RentalsLastYear),
    }));
  },

  async getModelBySlug(slug: string): Promise<CarModel | null> {
    const r = await (await request()).input('slug', sql.VarChar(80), slug).query(
      `SELECT m.*, c.CategoryName, c.Slug AS CategorySlug, c.DisplayOrder AS CategoryOrder
       FROM rental.CarModels m JOIN rental.CarCategories c ON c.CarCategoryId = m.CarCategoryId
       WHERE m.Slug = @slug AND m.IsActive = 1 AND c.IsActive = 1`,
    );
    return r.recordset[0] ? mapModel(r.recordset[0]) : null;
  },

  async getPricing(fromDate: string, toDate: string, modelIds: number[]): Promise<{ ranges: PricingRange[]; discounts: DurationDiscount[] }> {
    if (modelIds.length === 0) return { ranges: [], discounts: [] };
    const r = await (await request())
      .input('FromDate', sql.Date, fromDate)
      .input('ToDate', sql.Date, toDate)
      .input('CarModelIds', sql.VarChar(sql.MAX), modelIds.join(','))
      .execute('rental.usp_GetPricingRanges');
    const sets = r.recordsets as Row[][];
    return {
      ranges: sets[0].map((x) => ({
        carModelId: x.CarModelId as number,
        rangeStart: toIsoDate(x.RangeStart as Date),
        rangeEnd: toIsoDate(x.RangeEnd as Date),
        dailyRate: toNumber(x.DailyRate),
      })),
      discounts: sets[1].map((x) => ({
        carModelId: toNullableNumber(x.CarModelId),
        minDays: toNumber(x.MinDays),
        percentOff: toNumber(x.PercentOff),
      })),
    };
  },
};

export type CatalogRepository = typeof catalogRepository;
