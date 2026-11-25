import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Grid2 as Grid, Paper, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader, SectionTitle } from '../components/common';
import { company, faqGroups, features } from '../content/company';

export function AboutPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <>
      <PageHeader overline="About us" title="Car rental in Mauritius for over 20 years" subtitle="Flexible, friendly and focused on giving you a hassle-free holiday." />
      <Container sx={{ py: { xs: 5, md: 8 } }}>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
              Who we are
            </Typography>
            <Stack spacing={2} sx={{ color: 'text.secondary', fontSize: '1.05rem' }}>
              <Typography>
                MauriConnect Car Rental was founded by {company.founder} and has looked after visitors and residents for more than {company.yearsInBusiness} years. Our cars can be hired any day of the week, and
                booking online takes only a few minutes.
              </Typography>
              <Typography>
                Besides car rental we offer airport transfers, long-term rentals, and delivery and collection of your car at the airport, your hotel or any other address on the island.
              </Typography>
              <Typography>We put flexibility and customer satisfaction first, and we make every effort to make your trip around Mauritius easy.</Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Our office
              </Typography>
              <Stack spacing={1.25} color="text.secondary">
                <Typography>{company.address}</Typography>
                <Typography>{company.officeHours}</Typography>
                <Typography>{company.support}</Typography>
                <Typography>
                  {company.phone} · {company.email}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 6, md: 9 } }}>
          <SectionTitle title="What you can expect" />
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h5" component="h3">
                    {f.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                    {f.text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box id="faq" sx={{ mt: { xs: 6, md: 9 }, scrollMarginTop: 96 }}>
          <SectionTitle overline="FAQs" title="Frequently asked questions" />
          <Grid container spacing={4}>
            {faqGroups.map((g) => (
              <Grid key={g.title} size={{ xs: 12, md: 4 }}>
                <Typography variant="h5" component="h3" sx={{ mb: 1.5 }}>
                  {g.title}
                </Typography>
                {g.items.map((f) => (
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
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
}
