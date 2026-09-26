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
import { useFitnessCertificate } from 'src/hooks/fitness-certificate/use-fitness-certificate';
import { useSearchParams } from 'src/hooks/use-search-params';
import { paths } from 'src/paths';
import { FitnessCertificateForm } from 'src/sections/fitness-certificate/fitness-certificate-form';
import type { FitnessCertificateFormValues } from '@libs/types';

const Page = () => {
  const { fitnessId } = useParams();
  const { fitnessCertificate, isLoading } = useFitnessCertificate(
    fitnessId ? Number(fitnessId) : undefined
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

  if (!fitnessCertificate) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <Typography>Fitness certificate record not found</Typography>
      </Box>
    );
  }

  const initialValues: FitnessCertificateFormValues = {
    CarId: fitnessCertificate.CarId,
    StartDate: fitnessCertificate.StartDate ? new Date(fitnessCertificate.StartDate) : null,
    EndDate: fitnessCertificate.EndDate ? new Date(fitnessCertificate.EndDate) : null,
    Note: fitnessCertificate.Note || '',
    CertificateNumber: fitnessCertificate.CertificateNumber || '',
    IssuedBy: fitnessCertificate.IssuedBy || '',
    IsActive: fitnessCertificate.IsActive ?? true,
    CreatedBy: fitnessCertificate.LastModifiedUserId || 'system'
  };

  return (
    <>
      <Seo title="Fitness Certificate: Edit" />
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
                <Typography variant="h4">
                  Edit Fitness Certificate: {fitnessCertificate.Car?.Model} (
                  {fitnessCertificate.Car?.CarNumber})
                </Typography>
              </Stack>
            </Stack>
            <FitnessCertificateForm
              mode="edit"
              initialValues={initialValues}
              fitnessId={fitnessCertificate.FitnessId}
              backHref={returnTo || undefined}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
