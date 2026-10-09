import Box from '@mui/material/Box';

import { Seo } from 'src/components/seo';
import { usePageView } from 'src/hooks/use-page-view';
import { CarScheduler } from 'src/sections/dashboard/overview/car-scheduler';

const Page = () => {
  usePageView();

  return (
    <>
      <Seo title="Dashboard: Scheduler" />
      <Box
        component="main"
        sx={{ flexGrow: 1 }}
      >
        <CarScheduler />
      </Box>
    </>
  );
};

export default Page;
