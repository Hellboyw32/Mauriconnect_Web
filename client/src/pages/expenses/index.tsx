import { hasPermission } from '@libs/permissions';
import type { Expense } from '@libs/types';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FileCheck02Icon from '@untitled-ui/icons-react/build/esm/File05';
import PlusIcon from '@untitled-ui/icons-react/build/esm/Plus';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { expenseApi } from 'src/api/expense';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { useExpenses } from 'src/hooks/expenses/use-expenses';
import { useAuth } from 'src/hooks/use-auth';
import { useDialog } from 'src/hooks/use-dialog';
import { paths } from 'src/paths';
import { ExpenseDeleteDialog } from 'src/sections/expense/expense-delete-dialog';
import { ExpenseDetailsDialog } from 'src/sections/expense/expense-details-dialog';
import { ExpenseDocumentViewerDialog } from 'src/sections/expense/expense-document-viewer-dialog';
import { formatAmount, formatRs } from 'src/utils/format-rs';
import { toLocalDate } from 'src/utils/local-date';
import { replaceIdPath } from 'src/utils/replace-id-path';
import { usePageView } from 'src/hooks/use-page-view';

const PAGE_SIZES = [10, 25, 50, 100];

const useDebounced = <T,>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const toDateString = (value: Date | null) => (value && !Number.isNaN(value.getTime()) ? format(value, 'yyyy-MM-dd') : undefined);

const Page = () => {
  usePageView();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const canCreate = hasPermission(user, 'Expenses', 'Create');
  const canEdit = hasPermission(user, 'Expenses', 'Edit');

  const [search, setSearch] = useState('');
  const [supplier, setSupplier] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'ExpenseDate', sort: 'desc' }]);
  const [isDeleting, setIsDeleting] = useState(false);

  const detailsDialog = useDialog<Expense>();
  const documentsDialog = useDialog<Expense>();
  const deleteDialog = useDialog<Expense>();

  const debouncedSearch = useDebounced(search);

  // Any filter change returns to the first page.
  useEffect(() => {
    setPaginationModel((previous) => ({ ...previous, page: 0 }));
  }, [debouncedSearch, supplier, fromDate, toDate]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      supplier: supplier || undefined,
      fromDate: toDateString(fromDate),
      toDate: toDateString(toDate),
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sortDir: sortModel[0]?.sort === 'asc' ? ('asc' as const) : ('desc' as const)
    }),
    [debouncedSearch, supplier, fromDate, toDate, paginationModel, sortModel]
  );

  const { data, isLoading, error, refetch } = useExpenses(filters);

  useEffect(() => {
    expenseApi
      .getSuppliers()
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
  }, [data.Total]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleDelete = useCallback(async () => {
    if (!deleteDialog.data) return;

    try {
      setIsDeleting(true);
      await expenseApi.deleteExpense(deleteDialog.data.ExpenseId);
      toast.success('Expense deleted');
      deleteDialog.handleClose();
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to delete the expense');
    } finally {
      setIsDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDialog.data, refetch]);

  const columns = useMemo<GridColDef<Expense>[]>(
    () => [
      {
        field: 'ExpenseDate',
        headerName: 'Expense Date',
        width: 120,
        valueGetter: ({ value }) => (value ? format(toLocalDate(value), 'dd/MM/yyyy') : '')
      },
      { field: 'InvoiceNumber', headerName: 'Invoice No.', width: 130, sortable: false },
      { field: 'SupplierName', headerName: 'Supplier', width: 180, sortable: false },
      { field: 'Description', headerName: 'Description', flex: 1, minWidth: 220, sortable: false },
      {
        field: 'AmountExcludingVAT',
        headerName: 'Excl. VAT (Rs)',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        valueFormatter: ({ value }) => formatAmount(value)
      },
      {
        field: 'VATAmount',
        headerName: 'VAT (Rs)',
        width: 110,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        valueFormatter: ({ value }) => formatAmount(value)
      },
      {
        field: 'TotalInvoiceAmount',
        headerName: 'Total (Rs)',
        width: 130,
        align: 'right',
        headerAlign: 'right',
        sortable: false,
        valueFormatter: ({ value }) => formatAmount(value)
      },
      {
        field: 'AttachmentCount',
        headerName: 'Documents',
        width: 110,
        sortable: false,
        renderCell: ({ row }) => (
          <Button
            disabled={!row.AttachmentCount}
            onClick={() => documentsDialog.handleOpen(row)}
            size="small"
            startIcon={
              <SvgIcon fontSize="small">
                <FileCheck02Icon />
              </SvgIcon>
            }
            title={row.AttachmentCount ? 'View supporting documents' : 'No documents uploaded'}
          >
            {row.AttachmentCount ?? 0}
          </Button>
        )
      },
      { field: 'CreatedBy', headerName: 'Created By', width: 130, sortable: false },
      {
        field: 'CreatedDate',
        headerName: 'Created Date',
        width: 120,
        sortable: false,
        valueGetter: ({ value }) => (value ? format(new Date(value), 'dd/MM/yyyy') : '')
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 230,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack
            direction="row"
            spacing={0.5}
          >
            <Button
              onClick={() => detailsDialog.handleOpen(row)}
              size="small"
            >
              View
            </Button>
            {canEdit && (
              <Button
                component={RouterLink}
                href={replaceIdPath(paths.expenses.edit, ':expenseId', row.ExpenseId)}
                size="small"
              >
                Edit
              </Button>
            )}
            {isAdmin && (
              <Button
                color="error"
                onClick={() => deleteDialog.handleOpen(row)}
                size="small"
              >
                Delete
              </Button>
            )}
          </Stack>
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, isAdmin]
  );

  const hasFilters = Boolean(search || supplier || fromDate || toDate);

  return (
    <>
      <Seo title="Expenses" />
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 8 }}
      >
        <Container maxWidth="xl">
          <Stack spacing={4}>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
              spacing={2}
              flexWrap="wrap"
            >
              <Stack spacing={0.5}>
                <Typography variant="h4">Expenses</Typography>
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  All company expenses recorded by users, with supplier invoices.
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={2}
              >
                {isAdmin && (
                  <Button
                    component={RouterLink}
                    href={paths.expenses.report}
                    variant="outlined"
                  >
                    VAT / Expense Report
                  </Button>
                )}
                {canCreate && (
                  <Button
                    component={RouterLink}
                    href={paths.expenses.create}
                    startIcon={
                      <SvgIcon>
                        <PlusIcon />
                      </SvgIcon>
                    }
                    variant="contained"
                  >
                    Add Expense
                  </Button>
                )}
              </Stack>
            </Stack>

            <Card>
              <Box sx={{ p: 2 }}>
                <Grid
                  container
                  spacing={2}
                  alignItems="center"
                >
                  <Grid
                    xs={12}
                    md={3}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Search supplier or invoice number"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </Grid>
                  <Grid
                    xs={12}
                    md={3}
                  >
                    <Autocomplete
                      size="small"
                      options={suppliers}
                      value={supplier}
                      onChange={(_, value) => setSupplier(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Supplier"
                        />
                      )}
                    />
                  </Grid>
                  <Grid
                    xs={6}
                    md={2}
                  >
                    <DatePicker
                      label="From"
                      format="dd/MM/yyyy"
                      value={fromDate}
                      maxDate={toDate ?? undefined}
                      onChange={setFromDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid
                    xs={6}
                    md={2}
                  >
                    <DatePicker
                      label="To"
                      format="dd/MM/yyyy"
                      value={toDate}
                      minDate={fromDate ?? undefined}
                      onChange={setToDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid
                    xs={12}
                    md={2}
                  >
                    <Button
                      disabled={!hasFilters}
                      fullWidth
                      onClick={() => {
                        setSearch('');
                        setSupplier(null);
                        setFromDate(null);
                        setToDate(null);
                      }}
                    >
                      Clear filters
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <DataGrid
                autoHeight
                columns={columns}
                rows={data.Items}
                getRowId={(row) => row.ExpenseId}
                loading={isLoading}
                disableRowSelectionOnClick
                disableColumnFilter
                paginationMode="server"
                rowCount={data.Total}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={PAGE_SIZES}
                sortingMode="server"
                sortModel={sortModel}
                onSortModelChange={(model) =>
                  setSortModel(model.length ? model : [{ field: 'ExpenseDate', sort: 'desc' }])
                }
                sx={{ border: 0, '& .MuiDataGrid-cell': { py: 1 } }}
                getRowHeight={() => 'auto'}
              />

              <Stack
                alignItems="center"
                direction="row"
                justifyContent="flex-end"
                spacing={4}
                sx={{ borderTop: 1, borderColor: 'divider', flexWrap: 'wrap', px: 3, py: 2 }}
              >
                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  Totals for {hasFilters ? 'the filtered' : 'all'} expenses ({data.Total})
                </Typography>
                <Typography variant="body2">
                  Excl. VAT: <strong>{formatRs(data.TotalExcludingVAT)}</strong>
                </Typography>
                <Typography variant="body2">
                  VAT: <strong>{formatRs(data.TotalVAT)}</strong>
                </Typography>
                <Typography variant="subtitle2">
                  Total: <strong>{formatRs(data.TotalIncludingVAT)}</strong>
                </Typography>
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Box>

      <ExpenseDetailsDialog
        expense={detailsDialog.data}
        open={detailsDialog.open}
        onClose={detailsDialog.handleClose}
        onViewDocuments={(expense) => documentsDialog.handleOpen(expense)}
      />

      {documentsDialog.data && (
        <ExpenseDocumentViewerDialog
          expenseId={documentsDialog.data.ExpenseId}
          open={documentsDialog.open}
          onClose={documentsDialog.handleClose}
        />
      )}

      <ExpenseDeleteDialog
        expense={deleteDialog.data}
        open={deleteDialog.open}
        onClose={deleteDialog.handleClose}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default Page;
