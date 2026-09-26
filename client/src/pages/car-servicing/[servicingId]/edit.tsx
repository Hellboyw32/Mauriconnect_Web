import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import ArrowLeftIcon from '@untitled-ui/icons-react/build/esm/ArrowLeft';
import { useParams } from 'react-router-dom';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useServicingRecord } from 'src/hooks/servicing/use-servicing-record';
import { paths } from 'src/paths';
import { CarServicingForm } from 'src/sections/car-servicing/car-servicing-form';
import type { ServicingFormValues } from '@libs/types';

const Page = () => {
  const { servicingId } = useParams();
  const { servicingRecord, isLoading } = useServicingRecord(
    servicingId ? Number(servicingId) : undefined
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!servicingRecord) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <Typography>Servicing record not found</Typography>
      </Box>
    );
  }

  const initialValues: ServicingFormValues = {
    CarId: servicingRecord.CarId,
    DateServiced: servicingRecord.DateServiced ? new Date(servicingRecord.DateServiced) : null,
    MileageServiced: servicingRecord.MileageServiced ?? '',
    ServicingFrequency: servicingRecord.ServicingFrequency ?? '',
    Note: servicingRecord.Note || '',
    CreatedBy: servicingRecord.LastModifiedUserId || 'system',
    IsCompleted: servicingRecord.IsCompleted ?? false
  };

  return (
    <>
      <Seo title="Car Servicing: Edit Record" />
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
                href={paths.carServicing.index}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Car Servicing</Typography>
              </Link>
            </div>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Edit Servicing Record: {servicingRecord.Car?.CarNumber}
                </Typography>
              </Stack>
            </Stack>
            <CarServicingForm
              mode="edit"
              initialValues={initialValues}
              servicingId={servicingRecord.ServicingId}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
