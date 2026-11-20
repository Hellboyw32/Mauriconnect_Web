import type { Expense, ExpenseDuplicate, ExpenseFormValues } from '@libs/types';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { expenseApi } from 'src/api/expense';
import { useRouter } from 'src/hooks/use-router';
import { ExpenseDocumentPicker } from 'src/sections/expense/expense-document-picker';
import { ExpenseDocumentViewerDialog } from 'src/sections/expense/expense-document-viewer-dialog';
import { paths } from 'src/paths';
import { formatRs } from 'src/utils/format-rs';
import { toLocalDate } from 'src/utils/local-date';
import { replaceIdPath } from 'src/utils/replace-id-path';
import * as Yup from 'yup';

interface ExpenseFormProps {
  mode?: 'create' | 'edit';
  expense?: Expense;
  backHref?: string;
}

interface FormValues {
  ExpenseDate: Date | null;
  InvoiceNumber: string;
  SupplierName: string;
  Description: string;
  AmountExcludingVAT: string;
  VATAmount: string;
  Notes: string;
}

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const amountSchema = (label: string) =>
  Yup.number()
    .typeError(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .required(`${label} is required`);

const validationSchema = Yup.object({
  ExpenseDate: Yup.date().nullable().required('Expense date is required'),
  InvoiceNumber: Yup.string().max(100, 'Invoice number must be 100 characters or fewer'),
  SupplierName: Yup.string().trim().required('Supplier name is required').max(200, 'Too long (max 200)'),
  Description: Yup.string().trim().required('Description is required').max(1000, 'Too long (max 1000)'),
  AmountExcludingVAT: amountSchema('Amount excluding VAT'),
  VATAmount: amountSchema('VAT amount')
});

const amountInputProps = { min: 0, step: '0.01' };
const rsAdornment = <InputAdornment position="start">Rs</InputAdornment>;

export const ExpenseForm: FC<ExpenseFormProps> = (props) => {
  const { mode = 'create', expense, backHref = paths.expenses.index } = props;
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<ExpenseDuplicate[]>([]);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documentCount, setDocumentCount] = useState(expense?.Attachments?.length ?? 0);
  // Set once the user has chosen "Save anyway" for a possible duplicate.
  const duplicateConfirmed = useRef(false);

  useEffect(() => {
    expenseApi
      .getSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, []);

  const initialValues: FormValues = useMemo(
    () => ({
      ExpenseDate: expense ? toLocalDate(expense.ExpenseDate) : new Date(),
      InvoiceNumber: expense?.InvoiceNumber ?? '',
      SupplierName: expense?.SupplierName ?? '',
      Description: expense?.Description ?? '',
      AmountExcludingVAT: expense ? String(expense.AmountExcludingVAT) : '',
      VATAmount: expense ? String(expense.VATAmount) : '0',
      Notes: expense?.Notes ?? ''
    }),
    [expense]
  );

  const checkDuplicates = useCallback(
    async (supplierName: string, invoiceNumber: string): Promise<ExpenseDuplicate[]> => {
      if (!supplierName.trim() || !invoiceNumber.trim()) {
        setDuplicates([]);
        return [];
      }

      try {
        const found = await expenseApi.findDuplicates(
          supplierName.trim(),
          invoiceNumber.trim(),
          expense?.ExpenseId ?? 0
        );
        setDuplicates(found);
        return found;
      } catch {
        // The warning is advisory - never let a failed lookup block saving.
        return [];
      }
    },
    [expense?.ExpenseId]
  );

  const formik = useFormik<FormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const found = await checkDuplicates(values.SupplierName, values.InvoiceNumber);

        if (found.length > 0 && !duplicateConfirmed.current) {
          setConfirmDuplicateOpen(true);
          return;
        }

        const payload: ExpenseFormValues = {
          ExpenseDate: format(values.ExpenseDate as Date, 'yyyy-MM-dd'),
          InvoiceNumber: values.InvoiceNumber.trim(),
          SupplierName: values.SupplierName.trim(),
          Description: values.Description.trim(),
          AmountExcludingVAT: round2(toNumber(values.AmountExcludingVAT)),
          VATAmount: round2(toNumber(values.VATAmount)),
          Notes: values.Notes
        };

        let expenseId = expense?.ExpenseId;

        if (mode === 'edit' && expenseId) {
          await expenseApi.updateExpense(expenseId, payload);
        } else {
          expenseId = (await expenseApi.createExpense(payload)).ExpenseId;
        }

        if (files.length > 0 && expenseId) {
          try {
            await expenseApi.uploadAttachments(expenseId, files);
          } catch (err) {
            // The expense itself is saved - send the user to its edit page so
            // they can retry the upload without re-entering anything.
            toast.error(`Expense saved, but the documents could not be uploaded: ${err.message}`);
            router.push(replaceIdPath(paths.expenses.edit, ':expenseId', expenseId));
            return;
          }
        }

        toast.success(mode === 'edit' ? 'Expense updated successfully' : 'Expense recorded successfully');
        router.push(backHref);
      } catch (error) {
        toast.error(error.message || `Failed to ${mode === 'edit' ? 'update' : 'save'} the expense`);
      } finally {
        duplicateConfirmed.current = false;
        setSubmitting(false);
      }
    }
  });

  const total = round2(toNumber(formik.values.AmountExcludingVAT) + toNumber(formik.values.VATAmount));

  const handleSaveAnyway = () => {
    duplicateConfirmed.current = true;
    setConfirmDuplicateOpen(false);
    formik.submitForm();
  };

  return (
    <form
      noValidate
      onSubmit={formik.handleSubmit}
    >
      <Stack spacing={4}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Expense details</Typography>

              {duplicates.length > 0 && (
                <Alert severity="warning">
                  <AlertTitle>Possible duplicate</AlertTitle>
                  {duplicates.map((duplicate) => (
                    <div key={duplicate.ExpenseId}>
                      {duplicate.SupplierName} invoice {duplicate.InvoiceNumber} was already recorded for{' '}
                      {format(toLocalDate(duplicate.ExpenseDate), 'dd/MM/yyyy')} (
                      {formatRs(duplicate.TotalInvoiceAmount)}) by {duplicate.CreatedBy}.
                    </div>
                  ))}
                </Alert>
              )}

              <Grid
                container
                spacing={3}
              >
                <Grid
                  xs={12}
                  md={6}
                >
                  <DatePicker
                    label="Expense Date (invoice date)"
                    format="dd/MM/yyyy"
                    value={formik.values.ExpenseDate}
                    onChange={(value) => formik.setFieldValue('ExpenseDate', value, true)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        name: 'ExpenseDate',
                        onBlur: formik.handleBlur,
                        error: !!(formik.touched.ExpenseDate && formik.errors.ExpenseDate),
                        helperText: formik.touched.ExpenseDate && (formik.errors.ExpenseDate as string)
                      }
                    }}
                  />
                </Grid>
                <Grid
                  xs={12}
                  md={6}
                >
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    name="InvoiceNumber"
                    value={formik.values.InvoiceNumber}
                    onChange={formik.handleChange}
                    onBlur={(event) => {
                      formik.handleBlur(event);
                      checkDuplicates(formik.values.SupplierName, formik.values.InvoiceNumber);
                    }}
                    error={!!(formik.touched.InvoiceNumber && formik.errors.InvoiceNumber)}
                    helperText={formik.touched.InvoiceNumber && formik.errors.InvoiceNumber}
                  />
                </Grid>
                <Grid xs={12}>
                  <Autocomplete
                    freeSolo
                    options={suppliers}
                    inputValue={formik.values.SupplierName}
                    onInputChange={(_, value) => formik.setFieldValue('SupplierName', value)}
                    onBlur={() => {
                      formik.setFieldTouched('SupplierName', true);
                      checkDuplicates(formik.values.SupplierName, formik.values.InvoiceNumber);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Supplier Name"
                        error={!!(formik.touched.SupplierName && formik.errors.SupplierName)}
                        helperText={formik.touched.SupplierName && formik.errors.SupplierName}
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={2}
                    label="Description of goods / services"
                    name="Description"
                    value={formik.values.Description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={!!(formik.touched.Description && formik.errors.Description)}
                    helperText={formik.touched.Description && formik.errors.Description}
                  />
                </Grid>
                <Grid
                  xs={12}
                  md={4}
                >
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Amount Excluding VAT"
                    name="AmountExcludingVAT"
                    InputProps={{ startAdornment: rsAdornment }}
                    inputProps={amountInputProps}
                    value={formik.values.AmountExcludingVAT}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={!!(formik.touched.AmountExcludingVAT && formik.errors.AmountExcludingVAT)}
                    helperText={formik.touched.AmountExcludingVAT && formik.errors.AmountExcludingVAT}
                  />
                </Grid>
                <Grid
                  xs={12}
                  md={4}
                >
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="VAT Amount"
                    name="VATAmount"
                    InputProps={{ startAdornment: rsAdornment }}
                    inputProps={amountInputProps}
                    value={formik.values.VATAmount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={!!(formik.touched.VATAmount && formik.errors.VATAmount)}
                    helperText={
                      (formik.touched.VATAmount && formik.errors.VATAmount) || 'Enter 0 if no VAT was charged'
                    }
                  />
                </Grid>
                <Grid
                  xs={12}
                  md={4}
                >
                  <TextField
                    fullWidth
                    label="Total Invoice Amount"
                    value={formatRs(total)}
                    InputProps={{ readOnly: true }}
                    helperText="Calculated: amount excluding VAT + VAT"
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Notes (optional)"
                    name="Notes"
                    value={formik.values.Notes}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
              >
                <Typography variant="h6">Supporting documents</Typography>
                {mode === 'edit' && expense && (
                  <Button
                    onClick={() => setDocumentsOpen(true)}
                    size="small"
                    variant="outlined"
                  >
                    View / manage uploaded documents ({documentCount})
                  </Button>
                )}
              </Stack>
              <ExpenseDocumentPicker
                files={files}
                onChange={setFiles}
                disabled={formik.isSubmitting}
              />
            </Stack>
          </CardContent>
        </Card>

        <Stack
          alignItems="center"
          direction="row"
          justifyContent="flex-end"
          spacing={1}
        >
          <Button
            color="inherit"
            disabled={formik.isSubmitting}
            onClick={() => router.push(backHref)}
          >
            Cancel
          </Button>
          <Button
            disabled={formik.isSubmitting}
            type="submit"
            variant="contained"
          >
            {formik.isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Expense' : 'Save Expense'}
          </Button>
        </Stack>
      </Stack>

      <Dialog
        open={confirmDuplicateOpen}
        onClose={() => setConfirmDuplicateOpen(false)}
      >
        <DialogTitle>Possible duplicate invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            An expense with the same supplier and invoice number is already recorded. Save this one as
            well?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            onClick={() => setConfirmDuplicateOpen(false)}
          >
            Go back
          </Button>
          <Button
            onClick={handleSaveAnyway}
            variant="contained"
          >
            Save anyway
          </Button>
        </DialogActions>
      </Dialog>

      {expense && (
        <ExpenseDocumentViewerDialog
          expenseId={expense.ExpenseId}
          open={documentsOpen}
          onClose={() => setDocumentsOpen(false)}
          allowRemove
          onChanged={() => setDocumentCount((count) => Math.max(count - 1, 0))}
        />
      )}
    </form>
  );
};
