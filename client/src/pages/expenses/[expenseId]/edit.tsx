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
import { useExpense } from 'src/hooks/expenses/use-expense';
import { usePageView } from 'src/hooks/use-page-view';
import { paths } from 'src/paths';
import { ExpenseForm } from 'src/sections/expense/expense-form';

const Page = () => {
  usePageView();
  const { expenseId } = useParams();
  const { expense, isLoading, error } = useExpense(expenseId ? Number(expenseId) : undefined);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // The API answers 404 both for a missing expense and for someone else's.
  if (!expense) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>{error || 'Expense not found'}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Seo title="Expenses: Edit" />
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
            <Typography variant="h4">
              Edit Expense: {expense.SupplierName}
              {expense.InvoiceNumber ? ` (${expense.InvoiceNumber})` : ''}
            </Typography>
            <ExpenseForm
              mode="edit"
              expense={expense}
            />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
