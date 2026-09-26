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
import { useCarInsurance } from 'src/hooks/car-insurance/use-car-insurance';
import { useSearchParams } from 'src/hooks/use-search-params';
import { paths } from 'src/paths';
import { CarInsuranceForm } from 'src/sections/car-insurance/car-insurance-form';
import type { CarInsuranceFormValues } from '@libs/types';

const Page = () => {
  const { carInsuranceId } = useParams();
  const { carInsurance, isLoading } = useCarInsurance(
    carInsuranceId ? Number(carInsuranceId) : undefined
  );
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

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

  if (!carInsurance) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <Typography>Car insurance record not found</Typography>
      </Box>
    );
  }

  const initialValues: CarInsuranceFormValues = {
    CarId: carInsurance.CarId,
    StartDate: carInsurance.StartDate ? new Date(carInsurance.StartDate) : null,
    EndDate: carInsurance.EndDate ? new Date(carInsurance.EndDate) : null,
    Note: carInsurance.Note || '',
    PolicyNumber: carInsurance.PolicyNumber || '',
    Insurer: carInsurance.Insurer || '',
    CoverageType: carInsurance.CoverageType || '',
    Premium: carInsurance.Premium ?? '',
    IsActive: carInsurance.IsActive ?? true,
    CreatedBy: carInsurance.LastModifiedUserId || 'system'
  };

  return (
    <>
      <Seo title="Car Insurance: Edit" />
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
                href={returnTo || paths.carInsurance.index}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Car Insurance</Typography>
              </Link>
            </div>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Edit Car Insurance: {carInsurance.Car?.Model} ({carInsurance.Car?.CarNumber})
                </Typography>
              </Stack>
            </Stack>
            <CarInsuranceForm
              mode="edit"
              initialValues={initialValues}
              carInsuranceId={carInsurance.CarInsuranceId}
              backHref={returnTo || undefined}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
