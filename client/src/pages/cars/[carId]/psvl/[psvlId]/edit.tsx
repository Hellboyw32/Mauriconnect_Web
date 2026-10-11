import type { PsvlFormValues } from '@libs/types';
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
import { usePsvl } from 'src/hooks/psvl/use-psvl';
import { useSearchParams } from 'src/hooks/use-search-params';
import { paths } from 'src/paths';
import { PsvlForm } from 'src/sections/psvl/psvl-form';
import { toLocalDate } from 'src/utils/local-date';
import { replaceIdPath } from 'src/utils/replace-id-path';

const Page = () => {
  const searchParams = useSearchParams();
  const { carId, psvlId } = useParams();
  const { psvl, isLoading } = usePsvl(psvlId ? Number(psvlId) : undefined);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Also guards against a PSVL id being opened under the wrong car's URL.
  if (!psvl || String(psvl.CarId) !== carId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>PSVL record not found</Typography>
      </Box>
    );
  }

  const returnTo = searchParams.get('returnTo');
  const backHref = returnTo || replaceIdPath(paths.cars.edit, ':carId', psvl.CarId);

  const initialValues: Partial<PsvlFormValues> = {
    StartDate: toLocalDate(psvl.StartDate),
    EndDate: toLocalDate(psvl.EndDate),
    Company: psvl.Company || '',
    Note: psvl.Note || ''
  };

  return (
    <>
      <Seo title="PSVL: Edit" />
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
                  {psvl.Car?.Model} ({psvl.Car?.CarNumber})
                </Typography>
              </Link>
            </div>
            <Typography variant="h4">
              Edit PSVL: {psvl.Car?.Model} ({psvl.Car?.CarNumber})
            </Typography>
            <PsvlForm
              mode="edit"
              carId={psvl.CarId}
              psvlId={psvl.PsvlId}
              initialValues={initialValues}
              backHref={backHref}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
