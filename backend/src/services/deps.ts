import type { CatalogRepository } from '../repositories/catalogRepository';
import type { BookingRepository } from '../repositories/bookingRepository';
import type { PaymentRepository } from '../repositories/paymentRepository';
import type { OutboxRepository } from '../repositories/outboxRepository';
import type { EnquiryRepository } from '../repositories/enquiryRepository';
import type { PaymentProvider } from '../payments/types';
import type { Mailer } from './mailer';

export interface AppConfig {
  officeEmail: string | null;
  publicSiteUrl: string;
  jwtSecret: string;
  bookingTokenTtlMinutes: number;
  linkTokenTtlDays: number;
  storageDir: string;
  cacheSeconds: number;
  /** Include demo ratings (IsSample) in car ratings. Development only. */
  showSampleReviews: boolean;
}

/** Everything a service needs, injected so tests can swap the payment provider, mailer and clock. */
export interface Deps {
  catalog: CatalogRepository;
  bookings: BookingRepository;
  payments: PaymentRepository;
  outbox: OutboxRepository;
  enquiries: EnquiryRepository;
  provider: PaymentProvider;
  mailer: Mailer;
  clock: () => Date;
  config: AppConfig;
}
