import type { Expense } from '@libs/types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { format } from 'date-fns';
import type { FC, ReactNode } from 'react';
import { formatRs } from 'src/utils/format-rs';
import { toLocalDate } from 'src/utils/local-date';

interface ExpenseDetailsDialogProps {
  expense?: Expense;
  open: boolean;
  onClose: () => void;
  onViewDocuments: (expense: Expense) => void;
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <Stack spacing={0.25}>
    <Typography
      color="text.secondary"
      variant="caption"
    >
      {label}
    </Typography>
    <Typography variant="body2">{children || '-'}</Typography>
  </Stack>
);

const stamp = (value?: string | null) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '');

export const ExpenseDetailsDialog: FC<ExpenseDetailsDialogProps> = (props) => {
  const { expense, open, onClose, onViewDocuments } = props;

  if (!expense) {
    return null;
  }

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
    >
      <DialogTitle>
        {expense.SupplierName}
        {expense.InvoiceNumber ? ` - ${expense.InvoiceNumber}` : ''}
      </DialogTitle>
      <DialogContent dividers>
        <Grid
          container
          spacing={3}
        >
          <Grid
            xs={12}
            sm={4}
          >
            <Field label="Expense (invoice) date">
              {format(toLocalDate(expense.ExpenseDate), 'dd/MM/yyyy')}
            </Field>
          </Grid>
          <Grid
            xs={12}
            sm={4}
          >
            <Field label="Invoice number">{expense.InvoiceNumber}</Field>
          </Grid>
          <Grid
            xs={12}
            sm={4}
          >
            <Field label="Supplier">{expense.SupplierName}</Field>
          </Grid>
          <Grid xs={12}>
            <Field label="Description">{expense.Description}</Field>
          </Grid>
          <Grid
            xs={12}
            sm={4}
          >
            <Field label="Amount excluding VAT">{formatRs(expense.AmountExcludingVAT)}</Field>
          </Grid>
          <Grid
            xs={12}
            sm={4}
          >
            <Field label="VAT amount">{formatRs(expense.VATAmount)}</Field>
          </Grid>
          <Grid
            xs={12}
            sm={4}
          >
            <Field label="Total invoice amount">
              <strong>{formatRs(expense.TotalInvoiceAmount)}</strong>
            </Field>
          </Grid>
          <Grid xs={12}>
            <Field label="Notes">{expense.Notes}</Field>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Grid
          container
          spacing={3}
        >
          <Grid
            xs={12}
            sm={6}
          >
            <Field label="Created by">
              {expense.CreatedBy} - {stamp(expense.CreatedDate)}
            </Field>
          </Grid>
          <Grid
            xs={12}
            sm={6}
          >
            <Field label="Last modified">
              {expense.LastModifiedBy ? `${expense.LastModifiedBy} - ${stamp(expense.LastModifiedDate)}` : ''}
            </Field>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={!expense.AttachmentCount}
          onClick={() => onViewDocuments(expense)}
        >
          View documents ({expense.AttachmentCount ?? 0})
        </Button>
        <Button
          color="inherit"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
