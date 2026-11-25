# MauriConnect Car Rental

Online car rental booking for [mauriconnect.com](https://mauriconnect.com): search, a three-step booking (car → customer details → PayPal payment), email confirmation with a PDF voucher, and Manage My Booking with online cancellation and refunds.

| Part | Stack | Folder |
| --- | --- | --- |
| Website | React 18, TypeScript, Material UI 6, React Router, React Hook Form + Zod, Axios, PayPal JS SDK | [frontend/](frontend/) |
| API | Node.js 20+, Express, TypeScript, Zod, JWT, Nodemailer, PDFKit | [backend/](backend/) |
| Database | Microsoft SQL Server 2019+ (or Azure SQL): tables, constraints, stored procedures, triggers | [database/](database/) |

Documentation:

- [Functional requirements and architecture](docs/FUNCTIONAL_REQUIREMENTS.md): what was taken from the existing site, the business rules, the design, and the assumptions to confirm
- [API reference](docs/API.md)
- [Deployment guide](docs/DEPLOYMENT.md)

## Quick start (local development)

### 1. Prerequisites

- Node.js 20.11 or later
- SQL Server 2019+ (Express or Developer edition is fine) with the [ODBC Driver 17 or 18](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)
- On Windows, Windows authentication works out of the box (`DB_DRIVER=msnodesqlv8`). Elsewhere use SQL authentication (`DB_DRIVER=tedious`).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env          # then edit: DB_*, JWT_SECRET, PAYMENT_PROVIDER
npm run db:seed:dev           # creates the MauriConnect database, schema, procedures, reference data and a test fleet
npm run dev                   # API on http://localhost:4000
```

For development without PayPal credentials set `PAYMENT_PROVIDER=fake`: payments are simulated (this is refused when `NODE_ENV=production`). With `SMTP_HOST` empty, emails are written as `.eml` files to `backend/storage/mail-preview/` so you can open them in any mail client.

To use the PayPal sandbox instead, create an app at [developer.paypal.com](https://developer.paypal.com/dashboard/applications/sandbox), then set `PAYMENT_PROVIDER=paypal`, `PAYPAL_MODE=sandbox`, `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`. Pay with a sandbox personal account.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # website on http://localhost:5173 (proxies /api to :4000)
```

## Tests

```bash
cd backend
npm test                      # all tests
npm run test:unit             # pricing, durations, cancellation policy, validation, tokens, PayPal client (no database)
npm run test:integration      # API tests against a real SQL Server database (MauriConnect_Test, rebuilt on each run)

cd ../frontend
npm test                      # booking session, validation, request building, components
```

Integration tests use the same SQL Server connection as `.env` with the database name `MauriConnect_Test`, which they drop and recreate. They cover availability search, booking creation, concurrent bookings of the same car, PayPal order and capture (with a simulated provider), duplicate and failed payments, webhooks, the confirmation email and voucher, booking lookup, cancellation and refunds.

## Project structure

```
backend/
  src/
    config/        environment validation, company details
    controllers/   HTTP only: parse request, call a service, send response
    services/      business logic: pricing, bookings, payments, cancellations, documents, email
    repositories/  SQL Server access (parameterised queries and stored procedures)
    payments/      payment provider interface, PayPal implementation, test simulator
    middleware/    auth (booking tokens, admin key), validation, rate limits, errors
    jobs/          background jobs: email outbox, expiry of unpaid holds
    database/      connection pool, migration runner
  tests/unit, tests/integration
database/
  migrations/      V001__schema.sql (tables), R__procedures.sql (procedures and triggers)
  seed/            reference_data.sql (categories, cars, prices, locations...), dev_fleet.sql (test cars)
frontend/
  src/
    pages/         Home, car listing, customer details, payment, confirmation, manage booking, about, contact, terms, privacy
    components/    search form, car card, booking summary, stepper, PayPal, cancellation dialog...
    layouts/       site layout (navigation, footer), booking layout (stepper + summary)
    services/      API client
    hooks/         booking session (kept across steps), catalogue data
    utils/ types/ theme/ routes/ content/
docs/
```

## Useful scripts

| Command (in `backend/`) | What it does |
| --- | --- |
| `npm run db:migrate` | Apply new migrations (safe to run on every deploy) |
| `npm run db:seed` | Migrate and insert reference data (idempotent) |
| `npm run db:seed:dev` | Same, plus two fictitious cars per model and sample star ratings (`IsSample`, shown only with `SHOW_SAMPLE_REVIEWS=true`). Refused in production |
| `npm run build` / `npm start` | Compile to `dist/` and run in production |
