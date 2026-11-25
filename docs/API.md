# MauriConnect API Reference

Base URL: `/api` (development: `http://localhost:4000/api`, or `http://localhost:5173/api` through the Vite proxy).

- Requests and responses are JSON (`Content-Type: application/json`), except PDF downloads.
- Local times are Mauritius time as `YYYY-MM-DDTHH:mm` (for example `2027-03-10T10:00`). `holdExpiresAt` is a UTC ISO instant.
- Amounts are in euros as numbers (`228.5`). All prices are calculated by the server. Price fields sent by a client are ignored.
- Internal database ids are never returned. Bookings are identified by their reference (`MC-YYMMDD-XXXX`), cars by slug and locations by code.

## Authentication

| Kind | How | Used for |
| --- | --- | --- |
| None | – | Catalogue, search, quotes, creating a booking, verifying a booking, enquiries |
| Booking token | `Authorization: Bearer <token>`, or `?token=<token>` on PDF downloads | Everything about one booking. Returned by `POST /bookings` and `POST /bookings/:reference/verify` (valid 120 minutes by default). The email link carries a longer-lived token (60 days). A token only grants access to the booking it was issued for (otherwise `403`) |
| Office API key | `X-API-Key: <ADMIN_API_KEY>` | `POST /payments/paypal/refund`. Disabled (404) when `ADMIN_API_KEY` is empty |

## Errors

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please check the highlighted fields.", "details": [{ "path": "customer.email", "message": "Enter a valid email address." }] } }
```

| Status | Typical codes |
| --- | --- |
| 400 | `VALIDATION_ERROR`, `INVALID_LOCATION`, `INVALID_DATE`, `INVALID_EXTRA`, `INVALID_IDEMPOTENCY_KEY` |
| 401 | `UNAUTHORIZED` (missing, invalid or expired token), `INVALID_SIGNATURE` (webhook) |
| 402 | `PAYMENT_DECLINED`, `PAYMENT_FAILED`: the customer was not charged and can retry |
| 403 | `FORBIDDEN`: token issued for another booking |
| 404 | `BOOKING_NOT_FOUND`, `CAR_NOT_FOUND`, `PAYMENT_NOT_FOUND`, `VOUCHER_NOT_AVAILABLE` |
| 409 | `ALREADY_PAID`, `BOOKING_NOT_PAYABLE`, `PAYMENT_NOT_PENDING`, `BOOKING_NOT_CANCELLABLE`, `NOTHING_TO_REFUND`, `CAR_DOUBLE_BOOKED` |
| 422 | `RETURN_BEFORE_PICKUP`, `PICKUP_TOO_SOON`, `PICKUP_TOO_FAR`, `RENTAL_TOO_SHORT`, `RENTAL_TOO_LONG`, `ADDRESS_REQUIRED`, `CAR_NOT_PRICED`, `PAYMENT_MISMATCH`, `PICKUP_PASSED` |
| 429 | `RATE_LIMITED` |
| 502 / 503 | `PAYMENT_PROVIDER_ERROR`, `BUSY`: temporary, retry |

Every response has an `X-Request-Id` header (also accepted from the client) that appears in the server logs.

### Rate limits (per IP unless stated)

| Scope | Limit |
| --- | --- |
| All API calls | 120 per minute |
| `POST /bookings/:reference/verify` | 5 per 15 minutes per IP and reference, 20 per 15 minutes per IP |
| `POST /bookings` | 10 per hour |
| Payment endpoints | 30 per 10 minutes |
| `POST /enquiries` | 5 per hour |

---

## Catalogue

### `GET /health`
`{ "status": "ok" }`

### `GET /config`
Public settings for the website.
```json
{
  "paymentProvider": "paypal",
  "paypalClientId": "AbC...",
  "settings": { "minRentalDays": 3, "maxRentalDays": 90, "minLeadHours": 24, "openingTime": "08:00", "closingTime": "18:00", "holdMinutes": 30, "currency": "EUR", "timeZone": "Indian/Mauritius" }
}
```

### `GET /locations`
```json
[{ "code": "ssr-airport", "name": "SSR Intl Airport", "type": "Office", "address": "Sir Seewoosagur Ramgoolam International Airport, ...", "deliveryFee": 0, "requiresAddress": false },
 { "code": "hotel-north", "name": "Hotel Delivery – North Mauritius", "type": "DeliveryZone", "address": null, "deliveryFee": 0, "requiresAddress": true }]
```

### `GET /extras`
```json
[{ "code": "child-seat", "name": "Child car seat", "description": "For children from 9 to 18 kg.", "pricingType": "PerDay", "price": 3, "maxCharge": 30, "maxQuantity": 2 }]
```

### `GET /cars/categories`
```json
[{ "name": "Mini", "slug": "mini", "description": "Compact city cars, easy to park." }]
```

### `GET /cars/:slug`
One car model (`404 CAR_NOT_FOUND` if unknown).
```json
{ "slug": "suzuki-ertiga", "name": "Suzuki Ertiga", "description": "...", "category": "Full Size", "categorySlug": "full-size", "imageUrl": "/cars/full-size.svg",
  "transmission": "Automatic", "fuelType": "Petrol", "passengers": 7, "doors": 5, "luggage": 3, "airConditioning": true, "securityDeposit": null }
```

### `POST /cars/search`
Step 1. Validates the itinerary against the business rules and returns every bookable car with its full price.

Request:
```json
{ "pickupLocation": "ssr-airport", "returnLocation": "ssr-airport", "pickupAt": "2027-03-10T10:00", "returnAt": "2027-03-15T10:00" }
```
Response:
```json
{
  "search": { "pickupLocation": { "code": "ssr-airport", "...": "..." }, "returnLocation": { "...": "..." }, "pickupAt": "2027-03-10T10:00", "returnAt": "2027-03-15T10:00", "rentalDays": 5 },
  "categories": [{
    "name": "Mini", "slug": "mini",
    "cars": [{
      "slug": "suzuki-s-presso", "name": "Suzuki S-Presso", "category": "Mini", "...car fields": "...",
      "rentalDays": 5, "dailyRate": 20, "subTotal": 100, "additionalCharges": 0, "total": 100, "currency": "EUR",
      "charges": [{ "type": "Rental", "description": "Car rental: 5 days × €20.00", "quantity": 5, "amount": 100 }],
      "fleetAvailable": true
    }]
  }]
}
```
Each car also has `"rating": { "average": 4.3, "count": 147, "sample": false } | null` (shown from 3 published reviews; `sample: true` means demo ratings, development only) and `"badges": ["MostRented" | "MostLiked"]`. "Most rented" goes to the model with the most confirmed rentals in the last 12 months (at least 3); "Most liked" to the best average with at least 10 reviews. `GET /cars/:slug` returns the same `rating` and `badges`.

`fleetAvailable: false` means every fleet car of the model is taken for these dates (see the functional requirements, section 6, item 6).

### `POST /quotes`
Price of one car with extras (used for the step-2 summary).

Request: search fields plus `"carSlug": "toyota-vitz", "extras": [{ "code": "gps", "quantity": 1 }]`.
Response: `{ "search": {...}, "car": {...}, "price": { "rentalDays", "dailyRate", "subTotal", "additionalCharges", "total", "currency", "charges": [...] } }`

Charge `type` values: `Rental`, `Discount` (negative), `Delivery`, `OutOfHours`, `Extra`. `subTotal` is the rental after discount; `additionalCharges` is everything else.

---

## Bookings

### `POST /bookings`
Step 2. Creates an unpaid booking (`PendingPayment`), holds a car for `holdMinutes` and returns a booking token.

Headers: `Idempotency-Key: <16–64 characters [A-Za-z0-9_-]>` (recommended). Repeating a request with the same key returns the original booking with status `200` instead of `201`.

Request:
```json
{
  "search": { "pickupLocation": "hotel-west", "returnLocation": "ssr-airport", "pickupAt": "2027-03-10T10:00", "returnAt": "2027-03-16T10:00" },
  "carSlug": "suzuki-swift",
  "extras": [{ "code": "child-seat", "quantity": 2 }],
  "customer": {
    "firstName": "Léa", "lastName": "Dubois", "email": "lea@example.fr", "mobileNumber": "+33 6 12 34 56 78",
    "country": "FR", "nationality": "FR", "address": "12 rue de la Paix", "city": "Paris", "postalCode": "75002",
    "drivingLicenceNumber": null
  },
  "travel": {
    "flightNumber": "AF472", "arrivalAt": "2027-03-10T08:00", "accommodation": "Sugar Beach",
    "pickupAddress": "Sugar Beach Resort, Flic en Flac", "returnAddress": null, "specialRequests": null
  }
}
```
Rules: country and nationality are ISO 3166-1 alpha-2 codes; the mobile number must include the country code (stored as E.164); `pickupAddress`/`returnAddress` are required when the location has `requiresAddress: true`.

Response `201`: `{ "booking": Booking, "accessToken": "<jwt>" }`

### The `Booking` object
```json
{
  "reference": "MC-261031-ANH8",
  "status": "Confirmed",
  "paymentStatus": "Successful",
  "createdAt": "2026-10-31T08:07", "confirmedAt": "2026-10-31T08:07", "holdExpiresAt": null,
  "car": { "slug": "suzuki-swift", "name": "Suzuki Swift", "category": "Economy", "imageUrl": "/cars/economy.svg", "transmission": "Automatic", "fuelType": "Petrol", "passengers": 5, "doors": 4, "luggage": 1, "airConditioning": true },
  "pickup": { "location": Location, "at": "2027-03-10T10:00", "address": "Sugar Beach Resort, Flic en Flac" },
  "return": { "location": Location, "at": "2027-03-16T10:00", "address": null },
  "rentalDays": 6,
  "charges": [ChargeLine], "subTotal": 144, "additionalCharges": 36, "total": 180, "currency": "EUR", "securityDeposit": null,
  "customer": { "firstName": "Léa", "...": "..." },
  "travel": { "flightNumber": "AF472", "arrivalAt": "2027-03-10T08:00", "accommodation": "Sugar Beach", "specialRequests": null },
  "payment": { "provider": "PayPal", "status": "Successful", "transactionId": "3C1234...", "amount": 180, "currency": "EUR", "paidAt": "2026-10-31T08:07", "refundAmount": 0, "refundReference": null },
  "cancellation": null,
  "canPay": false, "canCancel": true,
  "documents": { "voucher": true, "cancellation": false }
}
```
Booking `status`: `PendingPayment`, `Confirmed`, `InProgress`, `Completed`, `Cancelled`, `Expired` (unpaid hold ended; it can still be paid while the pickup is in the future).
`cancellation` (when cancelled): `{ "cancelledAt", "reason", "fee", "feePercent", "refundAmount", "refundStatus": "NoRefundDue|RefundPending|Refunded|RefundFailed", "refundReference" }`.

### `POST /bookings/:reference/verify`
Manage My Booking lookup. Request `{ "email": "lea@example.fr" }` (case-insensitive). Response `{ "booking": Booking, "accessToken": "<jwt>" }`. A wrong email and an unknown reference give the same `404`.

### `GET /bookings/:reference` *(booking token)*
Returns the `Booking`.

### `POST /bookings/:reference/abandon` *(booking token)*
Releases the hold of an unpaid booking (the customer went back to choose another car). Returns the `Booking` (now `Expired`).

### `GET /bookings/:reference/cancellation-quote` *(booking token)*
What cancelling now would cost. Nothing is changed.
```json
{ "allowed": true, "reason": null, "hoursBeforePickup": 72.5, "feePercent": 0, "fee": 0, "refundAmount": 180, "paidAmount": 180, "currency": "EUR",
  "policy": [{ "hoursBeforePickup": 48, "feePercent": 0 }, { "hoursBeforePickup": 0, "feePercent": 50 }] }
```
When `allowed` is false, `reason` explains why (already cancelled, rental started or completed, pickup passed).

### `POST /bookings/:reference/cancel` *(booking token)*
Request `{ "reason": "Flight cancelled" }` (optional, up to 500 characters). The fee is recalculated on the server, the booking is cancelled, the refund is issued through PayPal and a cancellation email with a PDF is queued.
Response `{ "alreadyCancelled": false, "booking": Booking }`. Repeating the request returns `alreadyCancelled: true` and retries a refund that failed.

### `GET /bookings/:reference/voucher` *(booking token or `?token=`)*
PDF voucher (`application/pdf`, attachment). `404 VOUCHER_NOT_AVAILABLE` until the booking is confirmed.

### `GET /bookings/:reference/cancellation-document` *(booking token or `?token=`)*
PDF cancellation confirmation for a cancelled booking.

---

## Payments (PayPal)

### `POST /payments/paypal/create-order` *(booking token)*
Request `{ "bookingReference": "MC-261031-ANH8" }`. Creates a PayPal order for the amount stored on the booking, or reuses an open one, and renews an expired hold. Response `201 { "orderId": "5O190127TN364715T" }`. Pass `orderId` to the PayPal JS SDK `createOrder` callback.

### `POST /payments/paypal/capture-order` *(booking token)*
Request `{ "bookingReference": "MC-261031-ANH8", "orderId": "5O190127TN364715T" }`, called from the SDK `onApprove` callback. The server captures the order and checks amount, currency and reference before confirming.

| Response | Meaning |
| --- | --- |
| `200 { "outcome": "Confirmed", "booking": Booking }` | Paid and confirmed (also returned when the same capture is repeated) |
| `202 { "outcome": "PaymentPending", "booking": Booking }` | PayPal is still processing; the webhook confirms later |
| `402 PAYMENT_DECLINED` / `PAYMENT_FAILED` | Not charged; start again with `create-order` |
| `422 PAYMENT_MISMATCH` | The capture did not match the booking and was refunded automatically |
| `409 BOOKING_NOT_PAYABLE` | Booking already paid or cancelled; this capture was refunded automatically |

### `POST /payments/paypal/webhook`
Endpoint for PayPal webhooks (`PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.DECLINED`, others are logged). The signature is verified with PayPal using `PAYPAL_WEBHOOK_ID`. Each event is processed once.

### `POST /payments/paypal/refund` *(office API key)*
Retry a failed cancellation refund, or issue a goodwill refund. Request `{ "bookingReference": "MC-...", "amount": 20 }`. Without `amount`, a failed cancellation refund is retried, otherwise everything still paid is refunded. Returns the `Booking`.

---

## Enquiries

### `POST /enquiries`
Contact form and quote requests. Request:
```json
{ "type": "Quote", "name": "Léa Dubois", "email": "lea@example.fr", "phone": "+33 6 12 34 56 78", "message": "2 days from 10 March at the airport" }
```
Response `202`. The office receives an email.
