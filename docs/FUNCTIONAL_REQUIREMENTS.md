# MauriConnect – Functional Requirements and Architecture

Status: implemented. Last reviewed 2026-10-31.

This document records what was taken from the existing website, the business rules the new system applies, how it is built, and the points the business still needs to confirm before going live. Section 6 lists those open points.

## 1. Analysis of the existing website (mauriconnect.com, reviewed 2026-10-30)

| Area | Found on the existing site | Used in the new system |
| --- | --- | --- |
| Business | MauriConnect Car Rental, founded by Mr. H. Greedhur, over 20 years in business; Mauriconnect Ltd, L'escalier Road, Plaine Magnien | About page, footer, voucher, emails |
| Contact | +230 5255 1144 (phone and WhatsApp), info@mauriconnect.com, office Mon–Sat 08:00–18:00, 24/7 support | Header, footer, contact page, voucher |
| Selling points | Outstanding service, variety of brands, unlimited mileage, flexible rental periods, free delivery, 24-hour support | Home and About pages |
| Locations | SSR Intl Airport; Hotel Delivery North / East / South / West; Island Wide Delivery. Same-location return offered | `RentalLocations` seed. The airport is the default and the only office; the others are delivery zones that need an address |
| Cars | 11 models, all automatic with A/C, shown "or similar": Suzuki S-Presso, Hyundai Grand i10, Nissan March, Toyota Vitz, Suzuki Swift, Hyundai Accent, Nissan Almera, Suzuki Ciaz, Suzuki Ertiga, Toyota Rush, Hyundai Creta | `CarModels` seed with seats, doors and bags as published |
| Categories | Mini, Economy, Intermediate, Full Size (cars are not assigned to categories on the site) | Same four categories, no extra SUV category. The car-to-category mapping is an assumption (section 6) |
| Prices | "From" daily prices: €20 (S-Presso), €24 (economy models), €30 (Accent and other saloons), €43 (Ertiga, Rush), €45 (Creta). No seasonal prices published | One all-year rate per model (`CarPricing`). Date-range pricing is supported and can be added at any time |
| Booking rules (FAQ) | Minimum 3 days (2 days possible on request); driver at least 18 with a licence held 1 year; home licence accepted; deposit depends on car and insurance; delivery to any address | Minimum 3 days online (shorter: quote request); driver rules on voucher and terms; deposit taken at pickup |
| Payment (FAQ) | Bank transfer, PayPal or cash on arrival | Online bookings are paid with PayPal (account or card). Other methods by contacting the office |
| Rental terms | Authorised drivers only; no cover for drink driving; same-to-same fuel; payments on the spot in EUR/MUR or card; no refund of unused days once started; accident and theft rules; SCDW exclusions; no repairs without permission | Terms page, voucher (key terms) |
| Extras | Not listed with prices | Full insurance (SCDW), GPS, child seat, booster seat. Prices are placeholders (section 6) |
| Cancellation | Not published | Configurable policy table; placeholder: free 48 h or more before pickup, 50 % fee after (section 6) |

## 2. Pages

| Page | Route | Purpose |
| --- | --- | --- |
| Home | `/` | Search panel (pickup/return location, dates, times), categories, selling points, how it works, FAQ teaser |
| Step 1 – Select your car | `/booking/cars?from=&to=&pickup=&return=` | All bookable cars for the dates, grouped by category, with per-day and total price from the server |
| Step 2 – Customer details | `/booking/details` | Extras, main driver, travel details, live booking summary. Creates the unpaid booking |
| Step 3 – Payment | `/booking/payment` | Summary, hold countdown, terms acceptance, PayPal Checkout |
| Booking confirmation | `/booking/confirmation/:reference` | Confirmation, voucher download |
| Manage my booking | `/manage-booking` | Look up by Booking ID + email (or the email link), voucher, complete payment, cancel |
| About us (with FAQ) | `/about` | Company, services, FAQs |
| Contact us | `/contact` | Contact details, message or quote request form |
| Terms and conditions | `/terms` | Online booking rules, cancellation, published rental terms |
| Privacy policy | `/privacy` | Data collected and why (draft: see section 6) |

The booking session (search, car, extras, everything typed on step 2) is kept in the browser tab's session storage. Going back a step or refreshing never loses it, and it is cleared after payment. Prices are never stored in the browser.

## 3. Business rules

All times are Mauritius time (UTC+4, no daylight saving). The API exchanges local times as `YYYY-MM-DDTHH:mm` and stores UTC.

**Search and rental length**
- Return must be after pickup. Pickup at least 24 hours ahead (`MinLeadHours`) and at most 18 months ahead.
- Rental days = started 24-hour periods. A return up to 59 minutes (`GraceMinutes`) after a full period is free. Minimum 3 days, maximum 90 days online.
- Office hours 08:00–18:00. An out-of-hours fee per pickup/return is supported (`OutOfHoursFee`, currently 0, as delivery is advertised as free).

**Pricing** (always calculated by the server: [backend/src/services/pricing.ts](../backend/src/services/pricing.ts))
- Each rental day is charged at the rate in force on its local calendar date (`CarPricing` date ranges), so a rental spanning two seasons is priced day by day. A car with no rate for any day of the rental is not offered online.
- Optional rental-length discounts (`DurationDiscounts`, global or per model; none configured).
- Additional charges, itemised: delivery/collection fee per location (currently 0), out-of-hours fees, extras (per day or per rental, with a cap per unit and a maximum quantity).
- The booking stores the itemised lines; the database checks they add up to the total.

**Availability and holds**
- Cars are booked by model ("or similar"); a physical car (`Cars`) is assigned when the booking is created.
- A car counts as taken by bookings that are Confirmed or In progress, or Pending payment with an unexpired hold (30 minutes, `HoldMinutes`). Expired and cancelled bookings free the car.
- Two bookings can never hold the same physical car for overlapping periods: booking work is serialised per model with an application lock, cars are picked under range locks, and a database trigger rejects any overlapping write from any source.
- When every fleet car of a model is taken, the model is still sold and the booking is flagged as needing an outsourced car (office email says so). Section 6 explains this choice.

**Payment**
- The booking becomes Confirmed only after the server captures the PayPal order and verifies that the amount, currency and booking reference match. A mismatch is refunded automatically.
- Duplicate protection: one Idempotency-Key per booking request, idempotent PayPal request ids, a unique capture id, at most one successful payment per booking, and replayed captures or webhooks are recognised.
- A failed or declined payment can be retried; the same booking is reused. An open order is reused for 3 hours.
- A PayPal webhook confirms bookings whose browser never returned.
- Payment statuses: Pending, Successful, Failed, Refunded, PartiallyRefunded, Cancelled.

**Confirmation**
- Booking ID format `MC-YYMMDD-XXXX` (creation date + 4 random characters without 0/O/1/I), unique in the database.
- Confirmation and office emails are queued in the same transaction as the payment (outbox) and sent by a background job with retries. An email failure never affects the payment. The customer email carries the PDF voucher.

**Manage my booking and cancellation**
- Access requires the Booking ID and the booking email, or the signed link in the email. The error message never reveals which of the two was wrong. Lookups are rate-limited.
- Cancellation is possible for Confirmed or Pending-payment bookings until the pickup time, never for in-progress or completed rentals.
- The fee comes from the active policy: the rule with the largest "hours before pickup" that the cancellation still meets. If no rule matches, no refund is promised.
- The refund is issued through PayPal immediately. If it fails, the booking is still cancelled, the refund is marked as failed, the office is alerted and the refund is retried on the next request.
- Duplicate cancellation requests return the first result. Every status change is written to `BookingAuditLog`.

## 4. Architecture

```
Browser (React + MUI)                    PayPal
   │  /api (JSON, JWT booking token)       ▲ Orders v2 / Payments v2, webhooks
   ▼                                       │
Express API ── controllers → services → repositories ──► SQL Server
   │                    │                                (procedures, triggers,
   │                    ├─ payment provider (PayPal | fake)  constraints)
   │                    ├─ PDF documents (PDFKit)
   │                    └─ email (SMTP / preview files)
   └─ background jobs: email outbox (every 5 s), expire unpaid holds (every minute)
```

- **Layers.** Controllers only translate HTTP; services hold the business rules and get their dependencies injected (repositories, payment provider, mailer, clock), so they are tested with a simulated provider; repositories hold all SQL.
- **Payment providers** implement one interface ([backend/src/payments/types.ts](../backend/src/payments/types.ts)); adding Stripe or a local gateway does not change the services.
- **Security.** Server-side validation of every request (Zod), parameterised queries and stored procedures only, Helmet headers, strict CORS, rate limits (global, lookup, booking, payments, enquiries), 64 kB JSON limit, booking-scoped JWTs, constant-time admin key check, internal ids never exposed, output escaping in emails, card data never touches the system, secrets only in environment variables (validated at start-up).
- **Ready for an admin portal.** Status changes go through stored procedures with audit logging; the office refund endpoint already uses an API key. A staff portal can reuse the same services.

## 5. Database

Scripts: [database/migrations/V001__schema.sql](../database/migrations/V001__schema.sql), [R__procedures.sql](../database/migrations/R__procedures.sql). Applied by `npm run db:migrate`, which records applied versions and re-applies the repeatable script when it changes.

| Table | Purpose |
| --- | --- |
| CarCategories | Mini, Economy, Intermediate, Full Size |
| CarModels | What customers book: name, category, transmission, fuel, seats, doors, luggage, A/C, image, deposit |
| Cars | Physical fleet units (registration number) assigned to bookings |
| CarPricing | Daily rate per model and date range (overlaps rejected by trigger) |
| DurationDiscounts | Optional discounts by rental length |
| RentalLocations | Office and delivery zones, delivery fee, whether an address is required |
| Extras | Optional extras and their pricing |
| Settings | Business settings (minimum days, grace, hold, lead time, opening hours, fees) |
| CancellationPolicies, CancellationPolicyRules | Active cancellation policy and its fee steps |
| Customers | Customer details per booking |
| Bookings | Reference, customer, model, assigned car, locations, times (UTC), days, amounts, statuses, hold expiry, travel details, idempotency key, row version |
| BookingCharges | Itemised price lines |
| Payments | Provider, PayPal order id, capture id, amount, status, refunds, raw responses |
| PaymentEvents | Webhook events (unique provider event id) |
| BookingCancellation | Date, reason, policy, fee, refund, refund status/reference |
| BookingDocuments | Generated vouchers and cancellation documents |
| EmailOutbox | Queued emails with retry state |
| CarReviews | Star ratings per model; real ones tied to a booking, sample ones flagged `IsSample` |
| BookingAuditLog | Every action and status change, with actor and IP |
| Enquiries | Contact and quote requests |

The brief's single "Cars" table is split into CarModels (what is sold) and Cars (fleet units), because customers book a model "or similar" while overlap rules apply to physical cars. The brief's `Customers` endpoints are not public: customers are created as part of `POST /api/bookings`, and customer data is only returned through a booking the caller has proven access to.

## 6. Assumptions and points to confirm before going live

| # | Item | Current value | Where to change |
| --- | --- | --- | --- |
| 1 | Car-to-category mapping | S-Presso: Mini; Grand i10, March, Vitz, Swift: Economy; Accent, Almera, Ciaz: Intermediate; Ertiga, Rush, Creta: Full Size | `database/seed/reference_data.sql` or the CarModels table |
| 2 | Daily rates | Published "from" prices, all year 2026–2030. Seasonal rates if any | CarPricing rows (add date ranges) |
| 3 | Extras prices | SCDW €8/day; GPS €3/day (max €30); child seat €3/day (max €30, up to 2); booster €2/day (max €20, up to 2) | Extras table |
| 4 | Cancellation policy | Free 48 h or more before pickup; 50 % fee after. The site publishes no policy | CancellationPolicyRules |
| 5 | Fleet | Development seed has 2 fictitious cars per model. Load the real fleet (registration numbers) | Cars table; do not run `--dev-fleet` in production |
| 6 | Full fleet | When all cars of a model are booked the model is still sold and flagged "outsourced", as the site sells "or similar" cars on request. The brief says booked vehicles should not be shown. To stop selling, filter cars with `fleetAvailable: false` in `catalogService.search` and refuse outsourced bookings in `usp_CreateBooking` | Business decision |
| 7 | Delivery and out-of-hours fees | 0 (site advertises free delivery) | RentalLocations.DeliveryFee, Settings.OutOfHoursFee |
| 8 | Security deposit amounts | Not set ("taken at pickup") | CarModels.SecurityDeposit |
| 9 | Second location | The home page also lists Goodlands with the same phone number; not in the reservation list, so not offered | RentalLocations |
| 10 | Privacy policy | Draft written from the data the system actually collects; needs a legal review | `frontend/src/pages/LegalPages.tsx` |
| 11 | Car images | Freely licensed Wikimedia Commons photos of each model, background removed and plates blanked (credits on `/credits`). Your own photos of your fleet would be better | CarModels.ImageUrl (files in `frontend/public/cars/`), `frontend/src/content/photoCredits.ts` |
| 13 | Ratings | Only verified renters can review (one review per booking, `rental.CarReviews`). The review request email and page are not built yet. Development databases get sample ratings flagged `IsSample`, shown only with `SHOW_SAMPLE_REVIEWS=true` and labelled "Demo ratings" | Next step: post-rental review email |
| 12 | Payment methods | Online: PayPal only. The FAQ also mentions bank transfer and cash on arrival | Business decision |
