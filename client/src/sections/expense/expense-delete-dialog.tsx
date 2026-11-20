import type { Expense } from '@libs/types';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import AlertTriangleIcon from '@untitled-ui/icons-react/build/esm/AlertTriangle';
import { format } from 'date-fns';
import type { FC } from 'react';
import { formatRs } from 'src/utils/format-rs';
import { toLocalDate } from 'src/utils/local-date';

interface ExpenseDeleteDialogProps {
  expense?: Expense;
  onClose?: () => void;
  onDelete?: () => void;
  open?: boolean;
  isDeleting?: boolean;
}

export const ExpenseDeleteDialog: FC<ExpenseDeleteDialogProps> = (props) => {
  const { expense, onClose, onDelete, open = false, isDeleting = false } = props;

  if (!expense) {
    return null;
  }

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <Paper elevation={12}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ display: 'flex', p: 3 }}
        >
          <Avatar sx={{ backgroundColor: 'error.lightest', color: 'error.main' }}>
            <SvgIcon>
              <AlertTriangleIcon />
            </SvgIcon>
          </Avatar>
          <div>
            <Typography variant="h5">Delete expense</Typography>
            <Typography
              variant="h6"
              sx={{ mt: 1 }}
            >
              {expense.SupplierName}
              {expense.InvoiceNumber ? ` - ${expense.InvoiceNumber}` : ''}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              {format(toLocalDate(expense.ExpenseDate), 'dd/MM/yyyy')} &middot;{' '}
              {formatRs(expense.TotalInvoiceAmount)}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
              variant="body2"
            >
              This removes the expense from the register and from VAT reports. The record and its
              documents are kept for audit.
            </Typography>
          </div>
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 3, px: 3 }}>
          <Button
            color="inherit"
            disabled={isDeleting}
            onClick={onClose}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={onDelete}
            startIcon={
              isDeleting ? (
                <CircularProgress
                  size={20}
                  color="inherit"
                />
              ) : null
            }
            sx={{ backgroundColor: 'error.main', '&:hover': { backgroundColor: 'error.dark' } }}
            variant="contained"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Paper>
    </Dialog>
  );
};
