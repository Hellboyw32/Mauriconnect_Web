# Deployment Guide

The system has three parts:

1. **Frontend**: static files (`frontend/dist`) served by any web server or CDN.
2. **API**: a Node.js process (`backend/dist/server.js`) behind a reverse proxy with HTTPS.
3. **Database**: SQL Server 2019+ or Azure SQL Database.

The simplest setup serves the frontend and the API from the same domain (`https://mauriconnect.com` and `https://mauriconnect.com/api`). Then no CORS configuration is needed and `VITE_API_BASE_URL` stays empty.

## 1. Database

1. Create a SQL login for the application. The first migration also needs permission to create the database (or create an empty `MauriConnect` database yourself and grant the login `db_owner` on it).
   ```sql
   CREATE LOGIN mauriconnect_app WITH PASSWORD = '<strong password>';
   -- after the database exists:
   USE MauriConnect; CREATE USER mauriconnect_app FOR LOGIN mauriconnect_app; ALTER ROLE db_owner ADD MEMBER mauriconnect_app;
   ```
   Once the schema is in place you can reduce permissions to `db_datareader`, `db_datawriter` and `EXECUTE` on schema `rental`, and run migrations with a separate admin login.
2. From `backend/` with the production `.env`:
   ```bash
   npm ci
   npm run db:seed        # schema, procedures and reference data. Never use db:seed:dev in production
   ```
   The runner creates the database if needed (with `READ_COMMITTED_SNAPSHOT ON`), applies `V*.sql` once, re-applies `R__procedures.sql` when it changes and merges reference data without overwriting rows you have edited. Run `npm run db:migrate` on every deploy.
3. Load the business data (see [FUNCTIONAL_REQUIREMENTS.md](FUNCTIONAL_REQUIREMENTS.md#6-assumptions-and-points-to-confirm-before-going-live)):
   - the real fleet: one `rental.Cars` row per vehicle (`CarModelId`, `RegistrationNumber`)
   - confirmed rates (`rental.CarPricing`; overlapping active ranges for a model are rejected), extras prices, cancellation rules, deposits
4. Back up the database daily (full) and keep transaction-log backups if using the full recovery model. Azure SQL does this automatically.

## 2. API

### Configuration

Copy `backend/.env.example` to `.env` (or set real environment variables in your host) and set at least:

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Port the reverse proxy forwards to, e.g. `4000` |
| `PUBLIC_SITE_URL` | `https://mauriconnect.com` (used in email links and voucher QR codes) |
| `CORS_ORIGINS` | The website origin(s), comma separated |
| `TRUST_PROXY` | `1` behind IIS, nginx, Azure App Service or a load balancer (needed for correct client IPs and rate limits) |
| `DB_DRIVER` | `tedious` (SQL authentication over TCP) |
| `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Database connection |
| `DB_ENCRYPT`, `DB_TRUST_SERVER_CERTIFICATE` | `true` / `false` (use a valid server certificate) |
| `JWT_SECRET` | 48+ random bytes: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `PAYMENT_PROVIDER`, `PAYPAL_MODE` | `paypal`, `live` (the fake provider is refused in production) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | From the PayPal live app (section 4) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Mail server (required in production) |
| `OFFICE_EMAIL` | Receives a copy of bookings, cancellations, refund alerts and enquiries |
| `ADMIN_API_KEY` | Long random string to enable the office refund endpoint, or empty to disable it |
| `SHOW_SAMPLE_REVIEWS` | `false` (the API refuses `true` in production) |
| `STORAGE_DIR` | Persistent folder for generated PDFs, e.g. `/var/lib/mauriconnect` or `D:\MauriConnect\storage` |

The API checks its configuration at start-up and refuses to start with a clear message if something is missing.

### Build and run

```bash
cd backend
npm ci
npm run build
npm run db:migrate
NODE_ENV=production node dist/server.js
```

Keep it running with a process manager:

- **Linux**: systemd or PM2 (`pm2 start dist/server.js --name mauriconnect-api`, `pm2 save`, `pm2 startup`).
- **Windows Server**: run it as a Windows service (for example with NSSM: `nssm install MauriConnectAPI "C:\Program Files\nodejs\node.exe" "D:\mauriconnect\backend\dist\server.js"`, set the working directory and environment), with IIS as the reverse proxy (URL Rewrite + Application Request Routing).
- **Azure App Service (Node 20 LTS)**: deploy `backend/` with `npm run build` as the build step and `node dist/server.js` as the start command, and put the variables in Application settings.

The API stops cleanly on SIGINT/SIGTERM. Several instances can run at once: the email outbox is claimed with row locks and hold expiry is idempotent. The health check is `GET /api/health`.

## 3. Frontend

```bash
cd frontend
npm ci
npm run build          # outputs frontend/dist
```

Set `VITE_API_BASE_URL` at build time only if the API is on another origin (for example `https://api.mauriconnect.com`). Then add the website origin to the API's `CORS_ORIGINS`.

Serve `dist/` with a fallback to `index.html` for client-side routes, and long caching for hashed assets:

```nginx
server {
  listen 443 ssl http2;
  server_name mauriconnect.com;
  # ssl_certificate ... (e.g. Let's Encrypt)

  root /var/www/mauriconnect/dist;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 1m;
  }

  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }

  location / {
    try_files $uri /index.html;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://www.paypal.com https://*.paypal.com; frame-src https://www.paypal.com https://*.paypal.com; connect-src 'self' https://*.paypal.com; img-src 'self' data: https://*.paypal.com https://*.paypalobjects.com; style-src 'self' 'unsafe-inline'; font-src 'self'";
  }
}
server { listen 80; server_name mauriconnect.com; return 301 https://$host$request_uri; }
```

On IIS, add a URL Rewrite rule that sends non-file, non-`/api` requests to `/index.html`, and a reverse-proxy rule for `/api/*`.

## 4. PayPal

1. In the [PayPal developer dashboard](https://developer.paypal.com/dashboard/applications), create a **Live** REST app for the business account and copy its client id and secret.
2. Add a webhook to the app: URL `https://mauriconnect.com/api/payments/paypal/webhook`, events `Payment capture completed`, `Payment capture denied`, `Payment capture declined`, `Payment capture refunded`. Copy the webhook id into `PAYPAL_WEBHOOK_ID`.
3. Make sure the PayPal account accepts EUR payments.
4. Test the full journey in **sandbox** first (`PAYPAL_MODE=sandbox` with sandbox credentials): pay with a sandbox personal account and with the "Debit or Credit Card" button, cancel and check the refund appears in the sandbox account.

## 5. Email

Use an SMTP service with SPF and DKIM configured for `mauriconnect.com`, so confirmations do not land in spam (your mail host, Microsoft 365, or a transactional service such as Brevo, Mailgun or Amazon SES). Emails are queued in `rental.EmailOutbox` and retried with backoff (1, 2, 4 … 64 minutes) for about 2 hours (8 attempts). Failed rows stay in the table with `LastError`.

Useful checks:

```sql
SELECT TOP 20 EmailId, Template, ToAddress, Status, Attempts, LastError, NextAttemptAtUtc FROM rental.EmailOutbox ORDER BY EmailId DESC;
-- resend a failed email:
UPDATE rental.EmailOutbox SET Status = 'Pending', Attempts = 0, NextAttemptAtUtc = SYSUTCDATETIME() WHERE EmailId = @id;
```

## 6. Go-live checklist

- [ ] Business data confirmed and loaded: fleet, rates, extras, cancellation policy, deposits, car photos
- [ ] No development fleet (`DEV-...` registrations) and no sample ratings (`SELECT COUNT(*) FROM rental.CarReviews WHERE IsSample = 1` returns 0) in the production database
- [ ] `NODE_ENV=production`, `PAYMENT_PROVIDER=paypal`, `PAYPAL_MODE=live`, webhook id set
- [ ] HTTPS everywhere; `TRUST_PROXY=1` behind the proxy
- [ ] `JWT_SECRET` and `ADMIN_API_KEY` are new random values, stored only in the server environment
- [ ] SMTP tested: book a car and check the customer and office emails and the PDF voucher
- [ ] Sandbox test passed: pay, decline and retry, cancel and refund
- [ ] Database backups scheduled; `STORAGE_DIR` on persistent, backed-up storage
- [ ] Monitoring on `GET /api/health`; logs (JSON on stdout) collected
- [ ] Privacy policy and terms reviewed

## 7. Operations

- **Logs**: one JSON line per request (with `X-Request-Id`) and per business event, on stdout. Tokens in URLs are redacted.
- **Audit**: `rental.BookingAuditLog` records every booking action (created, hold expired, payment captured or rejected, cancelled, refunded or refund failed).
- **Failed refunds**: the office is emailed. Retry with
  ```bash
  curl -X POST https://mauriconnect.com/api/payments/paypal/refund -H "X-API-Key: $ADMIN_API_KEY" -H "Content-Type: application/json" -d '{"bookingReference":"MC-261031-ANH8"}'
  ```
- **Outsourced bookings**: bookings made when the fleet was full have `IsOutsourced = 1`, and the office email flags them.
  ```sql
  SELECT BookingReference, PickupDateTimeUtc FROM rental.Bookings WHERE IsOutsourced = 1 AND BookingStatus = 'Confirmed' AND PickupDateTimeUtc > SYSUTCDATETIME();
  ```
