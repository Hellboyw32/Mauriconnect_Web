import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, Card, CardContent, Container, Grid2 as Grid, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { SectionTitle } from '../components/common';
import { SearchForm } from '../components/SearchForm';
import { company, faqGroups, features } from '../content/company';
import { useCatalog } from '../hooks/useCatalog';
import { catalogService } from '../services/catalogService';
import type { Category } from '../types/api';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  support: <SupportAgentOutlinedIcon />,
  brands: <VerifiedOutlinedIcon />,
  mileage: <AllInclusiveIcon />,
  calendar: <CalendarMonthOutlinedIcon />,
  delivery: <LocalShippingOutlinedIcon />,
  clock: <AccessTimeIcon />,
};

const CATEGORY_IMAGE: Record<string, string> = {
  mini: '/cars/suzuki-s-presso.webp',
  economy: '/cars/suzuki-swift.webp',
  intermediate: '/cars/hyundai-accent.webp',
  'full-size': '/cars/suzuki-ertiga.webp',
};

export function HomePage() {
  const { error, reload } = useCatalog();
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    catalogService.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          background: 'radial-gradient(circle at 85% 20%, rgba(242,140,40,.35), transparent 40%), linear-gradient(160deg, #0b4f8a 0%, #073864 55%, #052a4b 100%)',
          pt: { xs: 5, md: 9 },
          pb: { xs: 6, md: 10 },
        }}
      >
        <Box
          component="img"
          src="/cars/full-size.svg"
          alt=""
          sx={{ position: 'absolute', right: { md: -40, lg: 40 }, bottom: 24, width: 460, opacity: 0.16, display: { xs: 'none', md: 'block' }, pointerEvents: 'none' }}
        />
        <Container sx={{ position: 'relative' }}>
          <Typography variant="overline" sx={{ color: 'secondary.light' }}>
            Car rental Mauritius · for over {company.yearsInBusiness} years
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3.1rem' }, mt: 1, maxWidth: 760 }}>
            Explore Mauritius at your own pace
          </Typography>
          <Typography sx={{ mt: 2, fontSize: '1.15rem', color: 'rgba(255,255,255,.85)', maxWidth: 640 }}>
            Book a car online in minutes. We deliver it free to the airport, your hotel or any address on the island, with unlimited mileage included.
          </Typography>
          <Stack direction="row" spacing={3} sx={{ mt: 3, mb: { xs: 4, md: 5 }, display: { xs: 'none', sm: 'flex' } }}>
            {[
              ['Free', 'delivery'],
              ['Unlimited', 'mileage'],
              ['24/7', 'support'],
            ].map(([a, b]) => (
              <Stack key={a} direction="row" spacing={1} alignItems="baseline">
                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem' }}>{a}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,.75)' }}>{b}</Typography>
              </Stack>
            ))}
          </Stack>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mt: { xs: 4, sm: 0 }, color: 'text.primary', boxShadow: '0 24px 60px rgba(0,0,0,.25)', border: '3px solid', borderColor: 'secondary.main' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <DirectionsCarFilledOutlinedIcon color="primary" />
              <Typography variant="h4" component="h2">
                Find your rental car
              </Typography>
            </Stack>
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={reload}>Retry</Button>}>
                {error}
              </Alert>
            )}
            <SearchForm />
          </Paper>
        </Container>
      </Box>

      {categories.length > 0 && (
        <Container sx={{ py: { xs: 6, md: 9 } }}>
          <SectionTitle overline="Our fleet" title="A car for every trip" subtitle="All cars are automatic, air-conditioned and come with unlimited mileage." align="center" />
          <Grid container spacing={3}>
            {categories.map((c) => (
              <Grid key={c.slug} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <Box component="img" src={CATEGORY_IMAGE[c.slug] ?? '/cars/economy.svg'} alt="" loading="lazy" sx={{ display: 'block', width: '100%', height: 170, objectFit: 'contain', p: 2.5, background: 'linear-gradient(180deg, #f7f9fb 0%, #e9eef4 100%)' }} />
                  <CardContent>
                    <Typography variant="h5" component="h3">
                      {c.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {c.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      <Box sx={{ bgcolor: '#fff', borderBlock: '1px solid', borderColor: 'divider', py: { xs: 6, md: 9 } }}>
        <Container>
          <SectionTitle overline="Why MauriConnect" title="Hassle-free car rental" align="center" />
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Stack direction="row" spacing={2}>
                  <Avatar sx={{ bgcolor: 'rgba(11,79,138,.08)', color: 'primary.main', width: 52, height: 52 }}>{FEATURE_ICONS[f.icon]}</Avatar>
                  <Box>
                    <Typography variant="h5" component="h3">
                      {f.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                      {f.text}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 6, md: 9 } }}>
        <SectionTitle overline="How it works" title="Book in three simple steps" align="center" />
        <Grid container spacing={3}>
          {[
            ['1', 'Choose your car', 'Enter your dates and see every available car with its full price.'],
            ['2', 'Add your details', 'Tell us who is driving and where we should deliver the car.'],
            ['3', 'Pay securely', 'Pay with PayPal or card and receive your voucher by email straight away.'],
          ].map(([n, title, text]) => (
            <Grid key={n} size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', color: '#1d1d1d', fontWeight: 800, mb: 2 }}>{n}</Avatar>
                <Typography variant="h5" component="h3">
                  {title}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container sx={{ pb: { xs: 2, md: 4 } }}>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 5 }}>
            <SectionTitle overline="Good to know" title="Frequently asked questions" subtitle="Everything you need before you drive off." />
            <Button component={RouterLink} to="/about#faq" variant="outlined">
              See all FAQs
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {faqGroups.flatMap((g) => g.items).slice(0, 5).map((f) => (
              <Accordion key={f.question}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>{f.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{f.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>
      </Container>

      <Container sx={{ pt: { xs: 6, md: 8 } }}>
        <Paper sx={{ p: { xs: 3, md: 5 }, background: 'linear-gradient(120deg, #f28c28, #f6ad63)', color: '#1d1d1d' }} elevation={0}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h3" component="h2">
                Need a shorter rental or a special request?
              </Typography>
              <Typography sx={{ mt: 1 }}>Send us a quote request or message us on WhatsApp. We usually reply within the hour.</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button component={RouterLink} to="/contact?type=Quote" variant="contained" color="primary" size="large">
                Request a quote
              </Button>
              <Button href={company.whatsappUrl} target="_blank" rel="noopener" variant="outlined" color="inherit" size="large" startIcon={<WhatsAppIcon />}>
                WhatsApp
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </>
  );
}
