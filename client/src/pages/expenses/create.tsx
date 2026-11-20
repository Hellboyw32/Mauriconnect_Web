import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import ArrowLeftIcon from '@untitled-ui/icons-react/build/esm/ArrowLeft';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { usePageView } from 'src/hooks/use-page-view';
import { paths } from 'src/paths';
import { ExpenseForm } from 'src/sections/expense/expense-form';

const Page = () => {
  usePageView();

  return (
    <>
      <Seo title="Expenses: Add" />
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 8 }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4}>
            <div>
              <Link
                color="text.primary"
                component={RouterLink}
                href={paths.expenses.index}
                sx={{ alignItems: 'center', display: 'inline-flex' }}
                underline="hover"
              >
                <SvgIcon sx={{ mr: 1 }}>
                  <ArrowLeftIcon />
                </SvgIcon>
                <Typography variant="subtitle2">Expenses</Typography>
              </Link>
            </div>
            <Typography variant="h4">Add Expense</Typography>
            <ExpenseForm mode="create" />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
