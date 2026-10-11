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
import { useSearchParams } from 'src/hooks/use-search-params';
import { paths } from 'src/paths';
import { PsvlForm } from 'src/sections/psvl/psvl-form';
import { replaceIdPath } from 'src/utils/replace-id-path';

const Page = () => {
  const searchParams = useSearchParams();
  const { carId } = useParams();
  const { car, isLoading } = useCar(carId ? Number(carId) : undefined);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!car) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Car not found</Typography>
      </Box>
    );
  }

  const returnTo = searchParams.get('returnTo');
  const backHref = returnTo || replaceIdPath(paths.cars.edit, ':carId', car.CarId);

  return (
    <>
      <Seo title="PSVL: Create" />
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
                href={backHref}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">
                  {car.Model} ({car.CarNumber})
                </Typography>
              </Link>
            </div>
            <Typography variant="h4">
              Add PSVL: {car.Model} ({car.CarNumber})
            </Typography>
            <PsvlForm
              mode="create"
              carId={car.CarId}
              backHref={backHref}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
