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
import { useRoadTax } from 'src/hooks/road-tax/use-road-tax';
import { useSearchParams } from 'src/hooks/use-search-params';
import { paths } from 'src/paths';
import { RoadTaxForm } from 'src/sections/road-tax/road-tax-form';
import type { RoadTaxFormValues } from '@libs/types';

const Page = () => {
  const { roadTaxId } = useParams();
  const { roadTax, isLoading } = useRoadTax(roadTaxId ? Number(roadTaxId) : undefined);
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

  if (!roadTax) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <Typography>Road tax record not found</Typography>
      </Box>
    );
  }

  const initialValues: RoadTaxFormValues = {
    CarId: roadTax.CarId,
    StartDate: roadTax.StartDate ? new Date(roadTax.StartDate) : null,
    EndDate: roadTax.EndDate ? new Date(roadTax.EndDate) : null,
    Note: roadTax.Note || '',
    IsActive: roadTax.IsActive ?? true,
    CreatedBy: roadTax.LastModifiedUserId || 'system'
  };

  return (
    <>
      <Seo title="Road Tax: Edit" />
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
                href={returnTo || paths.roadTax.index}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex'
                }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Road Tax</Typography>
              </Link>
            </div>
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={4}
            >
              <Stack spacing={1}>
                <Typography variant="h4">
                  Edit Road Tax: {roadTax.Car?.Model} ({roadTax.Car?.CarNumber})
                </Typography>
              </Stack>
            </Stack>
            <RoadTaxForm
              mode="edit"
              initialValues={initialValues}
              roadTaxId={roadTax.RoadTaxId}
              backHref={returnTo || undefined}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
