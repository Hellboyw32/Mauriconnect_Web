import CloseIcon from '@mui/icons-material/Close';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  Grid2 as Grid,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { NavLink, Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Logo } from '../components/Logo';
import { company } from '../content/company';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact' },
  { to: '/terms', label: 'Rental terms' },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function MainLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ScrollToTop />
      <Box sx={{ bgcolor: 'primary.dark', color: 'rgba(255,255,255,.85)', fontSize: '0.85rem', display: { xs: 'none', md: 'block' } }}>
        <Container sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
          <Stack direction="row" spacing={3}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <ScheduleOutlinedIcon sx={{ fontSize: 16 }} />
              <span>Office: {company.officeHours}</span>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <WhatsAppIcon sx={{ fontSize: 16 }} />
              <span>{company.support}</span>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={3}>
            <Link href={company.phoneHref} color="inherit" underline="hover">
              {company.phone}
            </Link>
            <Link href={`mailto:${company.email}`} color="inherit" underline="hover">
              {company.email}
            </Link>
          </Stack>
        </Container>
      </Box>

      <AppBar position="sticky" elevation={0}>
        <Container>
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
            <Logo />
            <Box sx={{ flex: 1 }} />
            <Stack component="nav" direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }} aria-label="Main">
              {NAV.map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end
                  color="inherit"
                  sx={{ fontWeight: 600, '&.active': { color: 'primary.main', bgcolor: 'rgba(11,79,138,.06)' } }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
            <Button component={RouterLink} to="/manage-booking" variant="outlined" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              Manage my booking
            </Button>
            <IconButton aria-label="Open menu" onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 280, p: 2 }} role="navigation" aria-label="Mobile">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Logo />
            <IconButton aria-label="Close menu" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <List>
            {[...NAV, { to: '/manage-booking', label: 'Manage my booking' }, { to: '/privacy', label: 'Privacy policy' }].map((item) => (
              <ListItemButton key={item.to} component={NavLink} to={item.to} end sx={{ borderRadius: 2, '&.active': { color: 'primary.main', bgcolor: 'rgba(11,79,138,.06)' } }}>
                <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: 600 } }} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1.5}>
            <Button href={company.phoneHref} startIcon={<PhoneOutlinedIcon />} variant="outlined">
              {company.phone}
            </Button>
            <Button href={company.whatsappUrl} target="_blank" rel="noopener" startIcon={<WhatsAppIcon />} variant="contained" color="success">
              WhatsApp us
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1 }}>
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </Box>

      <Footer />
    </Box>
  );
}

function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0a2238', color: 'rgba(255,255,255,.78)', mt: 8 }}>
      <Container sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Logo light />
            <Typography sx={{ mt: 2, maxWidth: 340 }} variant="body2">
              Car rental in Mauritius for over {company.yearsInBusiness} years. Free delivery to the airport and your hotel, unlimited mileage and support around the clock.
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FooterHeading>Explore</FooterHeading>
            <FooterLinks links={[['/', 'Book a car'], ['/about', 'About us'], ['/contact', 'Contact us'], ['/manage-booking', 'Manage my booking']]} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FooterHeading>Information</FooterHeading>
            <FooterLinks links={[['/terms', 'Terms and conditions'], ['/privacy', 'Privacy policy'], ['/about#faq', 'FAQs'], ['/contact?type=Quote', 'Request a quote']]} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FooterHeading>Contact</FooterHeading>
            <Stack spacing={1.25} sx={{ fontSize: '0.9rem' }}>
              <FooterContact icon={<PlaceOutlinedIcon fontSize="small" />}>{company.address}</FooterContact>
              <FooterContact icon={<PhoneOutlinedIcon fontSize="small" />}>
                <Link href={company.phoneHref} color="inherit" underline="hover">
                  {company.phone}
                </Link>
              </FooterContact>
              <FooterContact icon={<WhatsAppIcon fontSize="small" />}>
                <Link href={company.whatsappUrl} target="_blank" rel="noopener" color="inherit" underline="hover">
                  WhatsApp {company.phone}
                </Link>
              </FooterContact>
              <FooterContact icon={<EmailOutlinedIcon fontSize="small" />}>
                <Link href={`mailto:${company.email}`} color="inherit" underline="hover">
                  {company.email}
                </Link>
              </FooterContact>
              <FooterContact icon={<ScheduleOutlinedIcon fontSize="small" />}>{company.officeHours}</FooterContact>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ borderColor: 'rgba(255,255,255,.12)', my: 4 }} />
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} {company.legalName}. All prices in euros. All times are Mauritius time (GMT+4).{' '}
          <Link component={RouterLink} to="/credits" color="inherit" underline="always">
            Photo credits
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}

const FooterHeading = ({ children }: { children: string }) => (
  <Typography sx={{ color: '#fff', fontWeight: 700, mb: 1.5 }}>{children}</Typography>
);

const FooterLinks = ({ links }: { links: [string, string][] }) => (
  <Stack spacing={1}>
    {links.map(([to, label]) => (
      <Link key={to} component={RouterLink} to={to} color="inherit" underline="hover" sx={{ fontSize: '0.9rem' }}>
        {label}
      </Link>
    ))}
  </Stack>
);

const FooterContact = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <Stack direction="row" spacing={1.25} alignItems="flex-start">
    <Box sx={{ color: 'secondary.light', display: 'flex', pt: '2px' }}>{icon}</Box>
    <Box>{children}</Box>
  </Stack>
);
