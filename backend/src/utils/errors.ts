export type ErrorDetail = { path?: string; message: string };

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (code: string, message: string, details?: ErrorDetail[]) => new AppError(400, code, message, details);
export const unauthorized = (message = 'Authentication required.') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have access to this resource.') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (code: string, message: string) => new AppError(404, code, message);
export const conflict = (code: string, message: string) => new AppError(409, code, message);
export const unprocessable = (code: string, message: string, details?: ErrorDetail[]) => new AppError(422, code, message, details);

// Codes raised by stored procedures with THROW, mapped to HTTP responses.
const sqlErrorMap: Record<string, { status: number; message: string }> = {
  BOOKING_NOT_FOUND: { status: 404, message: 'Booking not found.' },
  BOOKING_NOT_PAYABLE: { status: 409, message: 'This booking can no longer be paid.' },
  BOOKING_NOT_CANCELLABLE: { status: 409, message: 'This booking cannot be cancelled.' },
  PICKUP_PASSED: { status: 409, message: 'The pickup time has passed, so the booking can no longer be cancelled online.' },
  NOTHING_TO_REFUND: { status: 409, message: 'There is no payment to refund.' },
  CAR_DOUBLE_BOOKED: { status: 409, message: 'This car was just taken. Please try again.' },
  BOOKING_LOCK_TIMEOUT: { status: 503, message: 'We are busy processing other bookings. Please try again in a moment.' },
  CHARGES_TOTAL_MISMATCH: { status: 500, message: 'Price calculation error.' },
  PAYMENT_NOT_FOUND: { status: 404, message: 'Payment not found.' },
};

type SqlLikeError = { number?: number; message?: string; originalError?: { info?: { number?: number; message?: string } } };

export function sqlErrorNumber(err: unknown): number | undefined {
  const e = err as SqlLikeError;
  return e?.number ?? e?.originalError?.info?.number;
}

export function sqlErrorMessage(err: unknown): string {
  const e = err as SqlLikeError;
  return (e?.originalError?.info?.message ?? e?.message ?? '').toString();
}

export function isUniqueViolation(err: unknown, indexName?: string): boolean {
  const n = sqlErrorNumber(err);
  if (n !== 2601 && n !== 2627) return false;
  return indexName ? sqlErrorMessage(err).includes(indexName) : true;
}

/** Converts known database errors into AppErrors; returns undefined for anything else. */
export function translateSqlError(err: unknown): AppError | undefined {
  const n = sqlErrorNumber(err);
  const message = sqlErrorMessage(err);
  if (n === 1205) return new AppError(503, 'BUSY', 'We are busy processing other bookings. Please try again.');
  if (n !== undefined && n >= 50000) {
    const code = Object.keys(sqlErrorMap).find((k) => message.includes(k));
    if (code) return new AppError(sqlErrorMap[code].status, code, sqlErrorMap[code].message);
  }
  return undefined;
}
