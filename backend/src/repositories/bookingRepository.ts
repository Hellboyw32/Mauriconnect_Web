import type { BookingStatus, CancellationStatus, ChargeLine, ChargeType, PaymentStatus } from '../types/domain';
import { fromCents } from '../utils/money';
import { request, sql, withDeadlockRetry, toNullableNumber, toNumber } from './db';

export interface CreateBookingParams {
  reference: string;
  idempotencyKey: string | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    country: string;
    nationality: string;
    address: string;
    city: string;
    postalCode: string;
    drivingLicenceNumber: string | null;
  };
  carModelId: number;
  pickupLocationId: number;
  returnLocationId: number;
  pickupAddress: string | null;
  returnAddress: string | null;
  pickupUtc: Date;
  returnUtc: Date;
  rentalDays: number;
  subTotalCents: number;
  additionalCents: number;
  totalCents: number;
  securityDeposit: number | null;
  flightNumber: string | null;
  arrivalUtc: Date | null;
  accommodation: string | null;
  specialRequests: string | null;
  charges: ChargeLine[];
  ipAddress: string | null;
}

export interface CreateBookingResult {
  reference: string;
  isOutsourced: boolean;
  holdExpiresAtUtc: Date | null;
  isExisting: boolean;
}

export interface BookingRecord {
  bookingId: number;
  reference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  isOutsourced: boolean;
  pickupUtc: Date;
  returnUtc: Date;
  rentalDays: number;
  subTotal: number;
  additionalCharges: number;
  total: number;
  currency: string;
  securityDeposit: number | null;
  holdExpiresAtUtc: Date | null;
  pickupAddress: string | null;
  returnAddress: string | null;
  flightNumber: string | null;
  arrivalUtc: Date | null;
  accommodation: string | null;
  specialRequests: string | null;
  createdAtUtc: Date;
  confirmedAtUtc: Date | null;
  cancelledAtUtc: Date | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    country: string;
    nationality: string;
    address: string;
    city: string;
    postalCode: string;
    drivingLicenceNumber: string | null;
  };
  model: {
    id: number;
    slug: string;
    name: string;
    category: string;
    transmission: string;
    fuelType: string;
    passengers: number;
    doors: number;
    luggage: number;
    airConditioning: boolean;
    imageUrl: string | null;
  };
  pickupLocation: { code: string; name: string; type: string; address: string | null };
  returnLocation: { code: string; name: string; type: string; address: string | null };
  charges: { type: ChargeType; description: string; quantity: number; amount: number }[];
  payment: {
    paymentId: number;
    provider: string;
    orderId: string | null;
    captureId: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentDateUtc: Date | null;
    refundAmount: number;
    refundReference: string | null;
  } | null;
  cancellation: {
    cancelledAtUtc: Date;
    reason: string | null;
    hoursBeforePickup: number;
    feePercent: number;
    fee: number;
    refundAmount: number;
    status: CancellationStatus;
    refundReference: string | null;
  } | null;
}

type Row = Record<string, unknown>;

export const bookingRepository = {
  async create(p: CreateBookingParams): Promise<CreateBookingResult> {
    const charges = p.charges.map((c, i) => ({
      type: c.type,
      extraId: c.extraId ?? null,
      description: c.description,
      quantity: c.quantity,
      amount: fromCents(c.amountCents),
      sortOrder: i,
    }));
    const r = await withDeadlockRetry(async () => (await request())
      .input('BookingReference', sql.Char(14), p.reference)
      .input('IdempotencyKey', sql.VarChar(64), p.idempotencyKey)
      .input('FirstName', sql.NVarChar(100), p.customer.firstName)
      .input('LastName', sql.NVarChar(100), p.customer.lastName)
      .input('Email', sql.NVarChar(254), p.customer.email)
      .input('MobileNumber', sql.VarChar(20), p.customer.mobileNumber)
      .input('Country', sql.Char(2), p.customer.country)
      .input('Nationality', sql.Char(2), p.customer.nationality)
      .input('Address', sql.NVarChar(300), p.customer.address)
      .input('City', sql.NVarChar(100), p.customer.city)
      .input('PostalCode', sql.NVarChar(20), p.customer.postalCode)
      .input('DrivingLicenceNumber', sql.NVarChar(50), p.customer.drivingLicenceNumber)
      .input('CarModelId', sql.Int, p.carModelId)
      .input('PickupLocationId', sql.Int, p.pickupLocationId)
      .input('ReturnLocationId', sql.Int, p.returnLocationId)
      .input('PickupAddress', sql.NVarChar(300), p.pickupAddress)
      .input('ReturnAddress', sql.NVarChar(300), p.returnAddress)
      .input('PickupUtc', sql.DateTime2(0), p.pickupUtc)
      .input('ReturnUtc', sql.DateTime2(0), p.returnUtc)
      .input('RentalDays', sql.SmallInt, p.rentalDays)
      .input('SubTotal', sql.Decimal(10, 2), fromCents(p.subTotalCents))
      .input('AdditionalCharges', sql.Decimal(10, 2), fromCents(p.additionalCents))
      .input('TotalAmount', sql.Decimal(10, 2), fromCents(p.totalCents))
      .input('SecurityDeposit', sql.Decimal(10, 2), p.securityDeposit)
      .input('FlightNumber', sql.NVarChar(20), p.flightNumber)
      .input('ArrivalUtc', sql.DateTime2(0), p.arrivalUtc)
      .input('Accommodation', sql.NVarChar(200), p.accommodation)
      .input('SpecialRequests', sql.NVarChar(1000), p.specialRequests)
      .input('ChargesJson', sql.NVarChar(sql.MAX), JSON.stringify(charges))
      .input('IpAddress', sql.VarChar(45), p.ipAddress)
      .execute('rental.usp_CreateBooking'));
    const row = r.recordset[0];
    return {
      reference: String(row.BookingReference).trim(),
      isOutsourced: Boolean(row.IsOutsourced),
      holdExpiresAtUtc: row.HoldExpiresAtUtc ?? null,
      isExisting: Boolean(row.IsExisting),
    };
  },

  async findByReference(reference: string): Promise<BookingRecord | null> {
    const r = await (await request()).input('ref', sql.Char(14), reference).query(`
      DECLARE @id int = (SELECT BookingId FROM rental.Bookings WHERE BookingReference = @ref);

      SELECT b.*, c.FirstName, c.LastName, c.Email, c.MobileNumber, c.Country, c.Nationality, c.Address, c.City, c.PostalCode,
             c.DrivingLicenceNumber, m.Slug AS ModelSlug, m.ModelName, m.Transmission, m.FuelType, m.PassengerCapacity, m.DoorCount,
             m.LuggageCapacity, m.HasAirConditioning, m.ImageUrl, cat.CategoryName,
             pl.Code AS PickupCode, pl.LocationName AS PickupName, pl.LocationType AS PickupType, pl.Address AS PickupLocationAddress,
             rl.Code AS ReturnCode, rl.LocationName AS ReturnName, rl.LocationType AS ReturnType, rl.Address AS ReturnLocationAddress
      FROM rental.Bookings b
      JOIN rental.Customers c ON c.CustomerId = b.CustomerId
      JOIN rental.CarModels m ON m.CarModelId = b.CarModelId
      JOIN rental.CarCategories cat ON cat.CarCategoryId = m.CarCategoryId
      JOIN rental.RentalLocations pl ON pl.LocationId = b.PickupLocationId
      JOIN rental.RentalLocations rl ON rl.LocationId = b.ReturnLocationId
      WHERE b.BookingId = @id;

      SELECT ChargeType, Description, Quantity, Amount FROM rental.BookingCharges WHERE BookingId = @id ORDER BY SortOrder, ChargeId;

      -- The captured payment if any, otherwise the most recent attempt.
      SELECT TOP (1) * FROM rental.Payments WHERE BookingId = @id
      ORDER BY CASE WHEN PaymentStatus IN ('Successful', 'Refunded', 'PartiallyRefunded') THEN 0 ELSE 1 END, PaymentId DESC;

      SELECT * FROM rental.BookingCancellation WHERE BookingId = @id;
    `);
    const sets = r.recordsets as Row[][];
    const b = sets[0][0];
    if (!b) return null;
    const pay = sets[2][0];
    const can = sets[3][0];
    return {
      bookingId: b.BookingId as number,
      reference: String(b.BookingReference).trim(),
      status: b.BookingStatus as BookingStatus,
      paymentStatus: b.PaymentStatus as PaymentStatus,
      isOutsourced: Boolean(b.IsOutsourced),
      pickupUtc: b.PickupDateTimeUtc as Date,
      returnUtc: b.ReturnDateTimeUtc as Date,
      rentalDays: toNumber(b.RentalDays),
      subTotal: toNumber(b.SubTotal),
      additionalCharges: toNumber(b.AdditionalCharges),
      total: toNumber(b.TotalAmount),
      currency: String(b.Currency),
      securityDeposit: toNullableNumber(b.SecurityDeposit),
      holdExpiresAtUtc: (b.HoldExpiresAtUtc as Date) ?? null,
      pickupAddress: (b.PickupAddress as string) ?? null,
      returnAddress: (b.ReturnAddress as string) ?? null,
      flightNumber: (b.FlightNumber as string) ?? null,
      arrivalUtc: (b.ArrivalDateTimeUtc as Date) ?? null,
      accommodation: (b.Accommodation as string) ?? null,
      specialRequests: (b.SpecialRequests as string) ?? null,
      createdAtUtc: b.CreatedAtUtc as Date,
      confirmedAtUtc: (b.ConfirmedAtUtc as Date) ?? null,
      cancelledAtUtc: (b.CancelledAtUtc as Date) ?? null,
      customer: {
        firstName: b.FirstName as string,
        lastName: b.LastName as string,
        email: b.Email as string,
        mobileNumber: b.MobileNumber as string,
        country: String(b.Country),
        nationality: String(b.Nationality),
        address: b.Address as string,
        city: b.City as string,
        postalCode: b.PostalCode as string,
        drivingLicenceNumber: (b.DrivingLicenceNumber as string) ?? null,
      },
      model: {
        id: b.CarModelId as number,
        slug: b.ModelSlug as string,
        name: b.ModelName as string,
        category: b.CategoryName as string,
        transmission: b.Transmission as string,
        fuelType: b.FuelType as string,
        passengers: toNumber(b.PassengerCapacity),
        doors: toNumber(b.DoorCount),
        luggage: toNumber(b.LuggageCapacity),
        airConditioning: Boolean(b.HasAirConditioning),
        imageUrl: (b.ImageUrl as string) ?? null,
      },
      pickupLocation: { code: b.PickupCode as string, name: b.PickupName as string, type: b.PickupType as string, address: (b.PickupLocationAddress as string) ?? null },
      returnLocation: { code: b.ReturnCode as string, name: b.ReturnName as string, type: b.ReturnType as string, address: (b.ReturnLocationAddress as string) ?? null },
      charges: sets[1].map((c) => ({
        type: c.ChargeType as ChargeType,
        description: c.Description as string,
        quantity: toNumber(c.Quantity),
        amount: toNumber(c.Amount),
      })),
      payment: pay
        ? {
            paymentId: pay.PaymentId as number,
            provider: pay.PaymentProvider as string,
            orderId: (pay.PayPalOrderId as string) ?? null,
            captureId: (pay.PayPalCaptureId as string) ?? null,
            amount: toNumber(pay.Amount),
            currency: String(pay.Currency),
            status: pay.PaymentStatus as PaymentStatus,
            paymentDateUtc: (pay.PaymentDateUtc as Date) ?? null,
            refundAmount: toNumber(pay.RefundAmount),
            refundReference: (pay.RefundReference as string) ?? null,
          }
        : null,
      cancellation: can
        ? {
            cancelledAtUtc: can.CancellationDateUtc as Date,
            reason: (can.CancellationReason as string) ?? null,
            hoursBeforePickup: toNumber(can.HoursBeforePickup),
            feePercent: toNumber(can.FeePercent),
            fee: toNumber(can.CancellationFee),
            refundAmount: toNumber(can.RefundAmount),
            status: can.CancellationStatus as CancellationStatus,
            refundReference: (can.RefundReference as string) ?? null,
          }
        : null,
    };
  },

  async referenceById(bookingId: number): Promise<string | null> {
    const r = await (await request()).input('id', sql.Int, bookingId).query('SELECT BookingReference FROM rental.Bookings WHERE BookingId = @id');
    return r.recordset[0] ? String(r.recordset[0].BookingReference).trim() : null;
  },

  async renewHold(bookingId: number): Promise<void> {
    await withDeadlockRetry(async () => (await request()).input('BookingId', sql.Int, bookingId).execute('rental.usp_RenewHold'));
  },

  async abandon(bookingId: number): Promise<void> {
    await withDeadlockRetry(async () => (await request()).input('BookingId', sql.Int, bookingId).execute('rental.usp_AbandonBooking'));
  },

  async expireHolds(): Promise<number> {
    const r = await withDeadlockRetry(async () => (await request()).execute('rental.usp_ExpireHolds'));
    return toNumber(r.recordset[0]?.ExpiredCount);
  },

  async cancel(p: {
    bookingId: number;
    reason: string | null;
    policyId: number | null;
    hoursBeforePickup: number;
    feePercent: number;
    feeCents: number;
    refundCents: number;
    requestedBy: 'Customer' | 'Office';
    ipAddress: string | null;
  }): Promise<'Cancelled' | 'AlreadyCancelled'> {
    const r = await withDeadlockRetry(async () => (await request())
      .input('BookingId', sql.Int, p.bookingId)
      .input('Reason', sql.NVarChar(500), p.reason)
      .input('PolicyId', sql.Int, p.policyId)
      .input('HoursBeforePickup', sql.Decimal(10, 2), p.hoursBeforePickup)
      .input('FeePercent', sql.Decimal(5, 2), p.feePercent)
      .input('Fee', sql.Decimal(10, 2), fromCents(p.feeCents))
      .input('Refund', sql.Decimal(10, 2), fromCents(p.refundCents))
      .input('RequestedBy', sql.VarChar(20), p.requestedBy)
      .input('IpAddress', sql.VarChar(45), p.ipAddress)
      .execute('rental.usp_CancelBooking'));
    return r.recordset[0].Outcome;
  },

  async addDocument(bookingId: number, type: 'Voucher' | 'Cancellation', documentPath: string): Promise<void> {
    await (await request())
      .input('id', sql.Int, bookingId)
      .input('type', sql.VarChar(20), type)
      .input('path', sql.NVarChar(400), documentPath)
      .query('INSERT INTO rental.BookingDocuments (BookingId, DocumentType, DocumentPath) VALUES (@id, @type, @path)');
  },

  async audit(bookingId: number, action: string, description: string | null): Promise<void> {
    await (await request())
      .input('id', sql.Int, bookingId)
      .input('action', sql.VarChar(50), action)
      .input('description', sql.NVarChar(1000), description)
      .query('INSERT INTO rental.BookingAuditLog (BookingId, Action, Description) VALUES (@id, @action, @description)');
  },
};

export type BookingRepository = typeof bookingRepository;
