import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Seo } from 'src/components/seo';
import { usePageView } from 'src/hooks/use-page-view';

interface Item {
  image: string;
  newTab?: boolean;
  path: string;
  subtitle: string;
  title: string;
}

interface Section {
  title: string;
  items: Item[];
}

const Page = () => {
  const theme = useTheme();

  usePageView();

  return (
    <>
      <Seo title="Components" />
      <Box
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'neutral.800' : 'neutral.50',
          py: '120px'
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={1}>
            <Typography variant="h1">Browse components</Typography>
            <Typography
              color="text.secondary"
              variant="body1"
            >
              Browse through over 100 individual components and over 35 screens
            </Typography>
          </Stack>
        </Container>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="lg">
          <Stack
            divider={<Divider />}
            spacing={4}
          ></Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
