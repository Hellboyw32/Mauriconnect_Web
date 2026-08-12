import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import ArrowLeftIcon from '@untitled-ui/icons-react/build/esm/ArrowLeft';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useSearchParams } from 'src/hooks/use-search-params';
import { paths } from 'src/paths';
import { FitnessCertificateForm } from 'src/sections/fitness-certificate/fitness-certificate-form';

const Page = () => {
  const searchParams = useSearchParams();
  const carIdParam = searchParams.get('carId');
  const returnTo = searchParams.get('returnTo');

  return (
    <>
      <Seo title="Fitness Certificate: Create" />
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
                href={returnTo || paths.fitnessCertificate.index}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Fitness Certificate</Typography>
              </Link>
            </div>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">Create Fitness Certificate Record</Typography>
              </Stack>
            </Stack>
            <FitnessCertificateForm
              mode="create"
              presetCarId={carIdParam ? Number(carIdParam) : undefined}
              backHref={returnTo || undefined}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
