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
import { RoadTaxForm } from 'src/sections/road-tax/road-tax-form';

const Page = () => {
  const searchParams = useSearchParams();
  const carIdParam = searchParams.get('carId');
  const returnTo = searchParams.get('returnTo');

  return (
    <>
      <Seo title="Road Tax: Create" />
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
                <Typography variant="h4">Create Road Tax Record</Typography>
              </Stack>
            </Stack>
            <RoadTaxForm
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
