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
import { useCar } from 'src/hooks/cars/use-car';
import { paths } from 'src/paths';
import { CarForm } from 'src/sections/car/car-form';
import { CarFitnessSection } from 'src/sections/car/car-fitness-section';
import { CarInsuranceSection } from 'src/sections/car/car-insurance-section';
import { CarRoadTaxSection } from 'src/sections/car/car-road-tax-section';
import type { CarFormValues } from '@libs/types';

const Page = () => {
  const { carId } = useParams();
  const { car, isLoading } = useCar(carId ? Number(carId) : undefined);

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

  if (!car) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <Typography>Car not found</Typography>
      </Box>
    );
  }

  const initialValues: CarFormValues = {
    Model: car.Model || '',
    CategoryId: car.CarCategory?.CategoryId || 2,
    CarNumber: car.CarNumber || '',
    Description: car.Description || '',
    CurrentMileage: car.CurrentMileage || 0,
    ServicingFrequency: car.ServicingFrequency || 0,
    LastServicedMileage: car.LastServicedMileage || 0,
    IsActive: car.IsActive ?? true,
    CreatedBy: car.LastModifiedUserId || 'system'
  };

  return (
    <>
      <Seo title={`Car: Edit ${car.CarNumber}`} />
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
                href={paths.cars.index}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Cars</Typography>
              </Link>
            </div>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Edit Car: {car.Model} ({car.CarNumber})
                </Typography>
              </Stack>
            </Stack>
            <CarForm
              mode="edit"
              initialValues={initialValues}
              carId={car.CarId}
            >
              <Stack spacing={3}>
                <CarRoadTaxSection
                  carId={car.CarId}
                  carNumber={car.CarNumber}
                />
                <CarFitnessSection
                  carId={car.CarId}
                  carNumber={car.CarNumber}
                />
                <CarInsuranceSection
                  carId={car.CarId}
                  carNumber={car.CarNumber}
                />
              </Stack>
            </CarForm>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
