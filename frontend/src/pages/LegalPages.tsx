import { Box, Button, Container, Link, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { company, rentalTerms } from '../content/company';
import { photoCredits } from '../content/photoCredits';
import { useCatalog } from '../hooks/useCatalog';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" sx={{ mb: 1.25 }}>
        {title}
      </Typography>
      <Box sx={{ color: 'text.secondary', '& p': { mt: 0, mb: 1.25 }, '& li': { mb: 0.75 } }}>{children}</Box>
    </Box>
  );
}

export function TermsPage() {
  const { config } = useCatalog();
  const s = config?.settings;
  return (
    <>
      <PageHeader overline="Legal" title="Terms and conditions" subtitle="Please read these terms before booking. They form part of your rental contract." />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 5 } }}>
          <Section title="Online bookings">
            <ul>
              <li>The minimum rental is {s?.minRentalDays ?? 3} days. Each started 24-hour period counts as a rental day, with a short grace period on return.</li>
              <li>Online bookings need at least {s?.minLeadHours ?? 24} hours’ notice. For an earlier pickup please contact us.</li>
              <li>
                Prices are in euros and include unlimited mileage. A booking is confirmed only once payment has been received; you then receive a booking voucher by email.
              </li>
              <li>The main driver must be at least 18 years old and have held a driving licence for at least one year. A licence from your home country is accepted.</li>
              <li>A security deposit is taken at pickup. Its amount depends on the car and the insurance option chosen.</li>
              <li>Cars are booked by model “or similar”: you may receive a similar model from the same category.</li>
            </ul>
          </Section>
          <Section title="Cancellation">
            <p>
              You can cancel online in <RouterLink to="/manage-booking">Manage my booking</RouterLink> until the pickup time. Before you confirm, we show the cancellation fee that applies (which depends on how far
              ahead you cancel) and the amount that will be refunded to your payment method. A completed or ongoing rental cannot be cancelled online.
            </p>
          </Section>
          {rentalTerms.map((t) => (
            <Section key={t.title} title={t.title}>
              <ul>
                {t.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Section>
          ))}
          <Typography variant="body2" color="text.secondary">
            {company.legalName} · {company.address} · {company.email}
          </Typography>
        </Paper>
      </Container>
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <PageHeader overline="Legal" title="Privacy policy" subtitle="How we use the personal information you give us when you book a car." />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 5 } }}>
          <Section title="Who we are">
            <p>
              {company.legalName} ({company.address}) is responsible for the personal data collected on this website. Contact: {company.email}.
            </p>
          </Section>
          <Section title="What we collect">
            <ul>
              <li>Booking details: your name, email address, mobile number, country, nationality, residential address and, if you give it, your driving licence number.</li>
              <li>Travel details you choose to give: flight number, arrival time, accommodation, delivery address and special requests.</li>
              <li>Payment information returned by PayPal (transaction reference, amount and status). We never receive or store your card details.</li>
              <li>Technical data needed to protect the service, such as your IP address on bookings and enquiries.</li>
            </ul>
          </Section>
          <Section title="How we use it">
            <ul>
              <li>To prepare your rental contract, deliver and collect your car and contact you about your booking.</li>
              <li>To take payment, process refunds and keep the accounting records we are legally required to keep.</li>
              <li>To prevent fraud and misuse of the website.</li>
            </ul>
            <p>We do not sell your data or use it for advertising.</p>
          </Section>
          <Section title="Who we share it with">
            <p>Only with the services needed to run your booking: PayPal for payments, our email provider to send confirmations, and our hosting provider. They may only use it on our behalf.</p>
          </Section>
          <Section title="How long we keep it">
            <p>We keep booking records for as long as needed for the rental and to meet our legal and accounting obligations, then delete them.</p>
          </Section>
          <Section title="Your rights">
            <p>
              You can ask to see, correct or delete your personal data, or object to its use, by emailing {company.email}. You may also complain to the Data Protection Office of Mauritius.
            </p>
          </Section>
          <Section title="Cookies and storage">
            <p>We do not use advertising or tracking cookies. Your browser keeps your booking progress for the current tab only, so you do not lose it between steps; it is removed when you close the tab.</p>
          </Section>
        </Paper>
      </Container>
    </>
  );
}

export function NotFoundPage() {
  return (
    <Container sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h1">Page not found</Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        The page you are looking for does not exist or has moved.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
        <Button component={RouterLink} to="/" variant="contained">
          Book a car
        </Button>
        <Button component={RouterLink} to="/contact" variant="outlined">
          Contact us
        </Button>
      </Stack>
    </Container>
  );
}

export function CreditsPage() {
  return (
    <>
      <PageHeader overline="Credits" title="Photo credits" subtitle="The car photos on this site are from Wikimedia Commons and are used under their free licences." />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack spacing={2.5} component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {photoCredits.map((c) => (
              <Stack key={c.file} component="li" direction="row" spacing={2} alignItems="center">
                <Box component="img" src={c.file} alt="" loading="lazy" sx={{ width: 120, height: 72, objectFit: 'contain', bgcolor: '#eef3f8', p: 0.75, borderRadius: 1.5, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary">
                  <Link href={c.source} target="_blank" rel="noopener">
                    {c.title}
                  </Link>{' '}
                  by {c.author}, licensed under{' '}
                  {c.licenseUrl ? (
                    <Link href={c.licenseUrl} target="_blank" rel="noopener">
                      {c.license}
                    </Link>
                  ) : (
                    c.license
                  )}
                  . Background removed, number plates blanked and resized{c.license.startsWith('CC BY-SA') ? '; this modified version is shared under the same licence' : ''}.
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Photos show the model or a similar version; the car you receive may differ in colour, trim and equipment.
          </Typography>
        </Paper>
      </Container>
    </>
  );
}
