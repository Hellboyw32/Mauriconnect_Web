import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import ArrowLeftIcon from '@untitled-ui/icons-react/build/esm/ArrowLeft';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useBooking as useSingleBooking } from 'src/hooks/bookings/use-single-booking';
import { paths } from 'src/paths';
import { BookingEditForm } from 'src/sections/booking/booking-edit-form';

const Page = () => {
  const booking = useSingleBooking();

  return (
    <>
      <Seo title="Booking: Edit" />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <div>
              <Link
                color="text.primary"
                component={RouterLink}
                href={paths.bookings.index}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Bookings</Typography>
              </Link>
            </div>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">Edit Booking: {booking?.CustomerName}</Typography>
              </Stack>
            </Stack>
            {booking && <BookingEditForm booking={booking} />}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
