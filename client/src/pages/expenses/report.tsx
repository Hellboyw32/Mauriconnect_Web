import { COMPANY_NAME } from '@libs/constants';
import type { ExpenseReport } from '@libs/types';
import { pdf } from '@react-pdf/renderer';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ArrowLeftIcon from '@untitled-ui/icons-react/build/esm/ArrowLeft';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { expenseApi } from 'src/api/expense';
import { RouterLink } from 'src/components/router-link';
import { Seo } from 'src/components/seo';
import { usePageView } from 'src/hooks/use-page-view';
import { paths } from 'src/paths';
import { ExpenseReportPdfDocument } from 'src/sections/expense/expense-report-pdf-document';
import { formatAmount } from 'src/utils/format-rs';
import { toLocalDate } from 'src/utils/local-date';

const toDateString = (value: Date | null) => (value && !Number.isNaN(value.getTime()) ? format(value, 'yyyy-MM-dd') : '');

const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

interface RunResult {
  report: ExpenseReport;
  fromDate: string;
  toDate: string;
}

const Page = () => {
  usePageView();
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));
  const [result, setResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [busyAction, setBusyAction] = useState<'excel' | 'pdf' | 'print' | null>(null);

  const rangeError =
    !startDate || !endDate
      ? 'Select a start and an end date.'
      : startDate > endDate
        ? 'The start date must be on or before the end date.'
        : null;

  const handleRun = useCallback(async () => {
    if (rangeError) return;

    const fromDate = toDateString(startDate);
    const toDate = toDateString(endDate);

    try {
      setIsRunning(true);
      setResult({ report: await expenseApi.getReport(fromDate, toDate), fromDate, toDate });
    } catch (err) {
      setResult(null);
      toast.error(err.message || 'Failed to generate the report');
    } finally {
      setIsRunning(false);
    }
  }, [rangeError, startDate, endDate]);

  const handleExcel = useCallback(async () => {
    if (!result) return;

    try {
      setBusyAction('excel');
      saveBlob(
        await expenseApi.downloadReportExcel(result.fromDate, result.toDate),
        `Expenses_${result.fromDate}_to_${result.toDate}.xlsx`
      );
    } catch (err) {
      toast.error(err.message || 'Failed to export to Excel');
    } finally {
      setBusyAction(null);
    }
  }, [result]);

  const buildPdf = useCallback(
    (data: RunResult) =>
      pdf(
        <ExpenseReportPdfDocument
          report={data.report}
          fromDate={data.fromDate}
          toDate={data.toDate}
        />
      ).toBlob(),
    []
  );

  const handlePdf = useCallback(async () => {
    if (!result) return;

    try {
      setBusyAction('pdf');
      saveBlob(await buildPdf(result), `Expenses_${result.fromDate}_to_${result.toDate}.pdf`);
    } catch (err) {
      toast.error(err.message || 'Failed to export to PDF');
    } finally {
      setBusyAction(null);
    }
  }, [result, buildPdf]);

  // Print = the same PDF, opened in a hidden frame so the browser print dialog
  // shows the properly formatted report (not this screen with its menus).
  const handlePrint = useCallback(async () => {
    if (!result) return;

    try {
      setBusyAction('print');
      const url = URL.createObjectURL(await buildPdf(result));
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      frame.src = url;
      frame.onload = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        // Leave the frame long enough for the print dialog to read it.
        setTimeout(() => {
          document.body.removeChild(frame);
          URL.revokeObjectURL(url);
        }, 60_000);
      };
      document.body.appendChild(frame);
    } catch (err) {
      toast.error(err.message || 'Failed to print the report');
    } finally {
      setBusyAction(null);
    }
  }, [result, buildPdf]);

  return (
    <>
      <Seo title="Expenses: VAT Report" />
      <Box
        component="main"
        sx={{ flexGrow: 1, py: 8 }}
      >
        <Container maxWidth="xl">
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

            <Stack spacing={0.5}>
              <Typography variant="h4">Monthly VAT / Expense Report</Typography>
              <Typography
                color="text.secondary"
                variant="body2"
              >
                MRA Table 2 layout. Expenses are selected by their invoice date, not the date they were
                entered. VAT is shown exactly as recorded - nothing is assumed to be recoverable.
              </Typography>
            </Stack>

            <Card>
              <CardContent>
                <Grid
                  container
                  spacing={2}
                  alignItems="flex-start"
                >
                  <Grid
                    xs={12}
                    sm={4}
                    md={3}
                  >
                    <DatePicker
                      label="Start Date"
                      format="dd/MM/yyyy"
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid
                    xs={12}
                    sm={4}
                    md={3}
                  >
                    <DatePicker
                      label="End Date"
                      format="dd/MM/yyyy"
                      value={endDate}
                      minDate={startDate ?? undefined}
                      onChange={setEndDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid
                    xs={12}
                    sm={4}
                    md={3}
                  >
                    <Button
                      disabled={Boolean(rangeError) || isRunning}
                      fullWidth
                      onClick={handleRun}
                      size="large"
                      startIcon={
                        isRunning ? (
                          <CircularProgress
                            size={18}
                            color="inherit"
                          />
                        ) : null
                      }
                      variant="contained"
                    >
                      Run Report
                    </Button>
                  </Grid>
                </Grid>
                {rangeError && (
                  <Alert
                    severity="warning"
                    sx={{ mt: 2 }}
                  >
                    {rangeError}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {result && (
              <>
                <Grid
                  container
                  spacing={2}
                >
                  {[
                    { label: 'Total Expenses Excluding VAT', value: result.report.TotalExcludingVAT },
                    { label: 'Total Input VAT (as recorded)', value: result.report.TotalVAT },
                    { label: 'Total Expenses Including VAT', value: result.report.TotalIncludingVAT }
                  ].map((item) => (
                    <Grid
                      key={item.label}
                      xs={12}
                      md={4}
                    >
                      <Card>
                        <CardContent>
                          <Typography
                            color="text.secondary"
                            variant="overline"
                          >
                            {item.label}
                          </Typography>
                          <Typography variant="h5">Rs {formatAmount(item.value)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Card>
                  <Stack
                    alignItems="center"
                    direction="row"
                    flexWrap="wrap"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ p: 2 }}
                  >
                    <Stack>
                      <Typography variant="h6">{COMPANY_NAME}</Typography>
                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Period {format(toLocalDate(result.fromDate), 'dd/MM/yyyy')} to{' '}
                        {format(toLocalDate(result.toDate), 'dd/MM/yyyy')} - {result.report.Count} invoice
                        {result.report.Count === 1 ? '' : 's'} - generated {format(new Date(), 'dd/MM/yyyy')}
                      </Typography>
                    </Stack>
                    <Stack
                      direction="row"
                      spacing={1}
                    >
                      <Button
                        disabled={busyAction !== null}
                        onClick={handleExcel}
                        variant="outlined"
                      >
                        {busyAction === 'excel' ? 'Exporting...' : 'Export to Excel'}
                      </Button>
                      <Button
                        disabled={busyAction !== null}
                        onClick={handlePdf}
                        variant="outlined"
                      >
                        {busyAction === 'pdf' ? 'Preparing...' : 'Export to PDF'}
                      </Button>
                      <Button
                        disabled={busyAction !== null}
                        onClick={handlePrint}
                        variant="outlined"
                      >
                        {busyAction === 'print' ? 'Preparing...' : 'Print'}
                      </Button>
                    </Stack>
                  </Stack>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice Date</TableCell>
                          <TableCell>Invoice No.</TableCell>
                          <TableCell>Name of Supplier</TableCell>
                          <TableCell>Description of Goods/Services</TableCell>
                          <TableCell align="right">Value Excluding VAT (Rs)</TableCell>
                          <TableCell align="right">VAT Amount (Rs)</TableCell>
                          <TableCell align="right">Total Invoice Value (Rs)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.report.Rows.length === 0 && (
                          <TableRow>
                            <TableCell
                              align="center"
                              colSpan={7}
                              sx={{ py: 4 }}
                            >
                              No expenses recorded for this period.
                            </TableCell>
                          </TableRow>
                        )}
                        {result.report.Rows.map((row) => (
                          <TableRow
                            hover
                            key={row.ExpenseId}
                          >
                            <TableCell>{format(toLocalDate(row.InvoiceDate), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{row.InvoiceNumber || '-'}</TableCell>
                            <TableCell>{row.SupplierName}</TableCell>
                            <TableCell>{row.Description}</TableCell>
                            <TableCell align="right">{formatAmount(row.AmountExcludingVAT)}</TableCell>
                            <TableCell align="right">{formatAmount(row.VATAmount)}</TableCell>
                            <TableCell align="right">{formatAmount(row.TotalInvoiceAmount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ '& td': { fontWeight: 700, backgroundColor: 'action.hover' } }}>
                          <TableCell
                            align="right"
                            colSpan={4}
                          >
                            TOTAL
                          </TableCell>
                          <TableCell align="right">{formatAmount(result.report.TotalExcludingVAT)}</TableCell>
                          <TableCell align="right">{formatAmount(result.report.TotalVAT)}</TableCell>
                          <TableCell align="right">{formatAmount(result.report.TotalIncludingVAT)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default Page;
