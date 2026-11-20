import { COMPANY_NAME } from '@libs/constants';
import type { ExpenseReport } from '@libs/types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { formatAmount } from 'src/utils/format-rs';
import { toLocalDate } from 'src/utils/local-date';

interface ExpenseReportPdfDocumentProps {
  report: ExpenseReport;
  fromDate: string;
  toDate: string;
}

const COLUMNS = [
  { header: 'Invoice Date', width: '10%', align: 'left' as const },
  { header: 'Invoice No.', width: '13%', align: 'left' as const },
  { header: 'Name of Supplier', width: '20%', align: 'left' as const },
  { header: 'Description of Goods/Services', width: '25%', align: 'left' as const },
  { header: 'Value Excluding VAT (Rs)', width: '11%', align: 'right' as const },
  { header: 'VAT Amount (Rs)', width: '10%', align: 'right' as const },
  { header: 'Total Invoice Value (Rs)', width: '11%', align: 'right' as const }
];

const styles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 40, paddingHorizontal: 28, fontSize: 8, fontFamily: 'Helvetica' },
  company: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  meta: { fontSize: 8, color: '#555555', marginTop: 2 },
  summary: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0d0d0'
  },
  summaryCell: { flex: 1, padding: 6 },
  summaryLabel: { fontSize: 7, color: '#666666' },
  summaryValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  table: { borderWidth: 1, borderColor: '#bdbdbd' },
  headerRow: { flexDirection: 'row', backgroundColor: '#1e293b', color: '#ffffff' },
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  rowAlt: { backgroundColor: '#fafafa' },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#bdbdbd',
    backgroundColor: '#f1f5f9',
    fontFamily: 'Helvetica-Bold'
  },
  headerCell: { padding: 4, fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  cell: { padding: 4, fontSize: 8 },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 28,
    right: 28,
    fontSize: 7,
    color: '#999999',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});

const cellStyle = (index: number, extra: object = {}) => ({
  ...styles.cell,
  width: COLUMNS[index].width,
  textAlign: COLUMNS[index].align,
  ...extra
});

// MRA Table 2 (input invoices) laid out for printing / sharing for VAT preparation.
export const ExpenseReportPdfDocument = ({ report, fromDate, toDate }: ExpenseReportPdfDocumentProps) => (
  <Document title={`Expense Report ${fromDate} to ${toDate}`}>
    <Page
      size="A4"
      orientation="landscape"
      style={styles.page}
    >
      <View fixed>
        <Text style={styles.company}>{COMPANY_NAME}</Text>
        <Text style={styles.title}>Expense Report - MRA VAT Table 2 (Input Invoices)</Text>
        <Text style={styles.meta}>
          Period: {format(toLocalDate(fromDate), 'dd/MM/yyyy')} to {format(toLocalDate(toDate), 'dd/MM/yyyy')}
          {'   '}|{'   '}Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          {'   '}|{'   '}Amounts in Mauritian Rupees (Rs)
        </Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Total Expenses Excluding VAT</Text>
          <Text style={styles.summaryValue}>Rs {formatAmount(report.TotalExcludingVAT)}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Total VAT Amount (as recorded)</Text>
          <Text style={styles.summaryValue}>Rs {formatAmount(report.TotalVAT)}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Total Invoice Value</Text>
          <Text style={styles.summaryValue}>Rs {formatAmount(report.TotalIncludingVAT)}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Number of invoices</Text>
          <Text style={styles.summaryValue}>{report.Count}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View
          style={styles.headerRow}
          fixed
        >
          {COLUMNS.map((column, index) => (
            <Text
              key={column.header}
              style={{ ...styles.headerCell, width: column.width, textAlign: COLUMNS[index].align }}
            >
              {column.header}
            </Text>
          ))}
        </View>

        {report.Rows.length === 0 && (
          <View style={styles.row}>
            <Text style={{ ...styles.cell, width: '100%', textAlign: 'center' }}>
              No expenses recorded for this period.
            </Text>
          </View>
        )}

        {report.Rows.map((row, index) => (
          <View
            key={row.ExpenseId}
            style={index % 2 === 1 ? { ...styles.row, ...styles.rowAlt } : styles.row}
            wrap={false}
          >
            <Text style={cellStyle(0)}>{format(toLocalDate(row.InvoiceDate), 'dd/MM/yyyy')}</Text>
            <Text style={cellStyle(1)}>{row.InvoiceNumber || ''}</Text>
            <Text style={cellStyle(2)}>{row.SupplierName}</Text>
            <Text style={cellStyle(3)}>{row.Description}</Text>
            <Text style={cellStyle(4)}>{formatAmount(row.AmountExcludingVAT)}</Text>
            <Text style={cellStyle(5)}>{formatAmount(row.VATAmount)}</Text>
            <Text style={cellStyle(6)}>{formatAmount(row.TotalInvoiceAmount)}</Text>
          </View>
        ))}

        <View
          style={styles.totalRow}
          wrap={false}
        >
          <Text style={{ ...cellStyle(0), width: '68%', textAlign: 'right' }}>TOTAL</Text>
          <Text style={cellStyle(4)}>{formatAmount(report.TotalExcludingVAT)}</Text>
          <Text style={cellStyle(5)}>{formatAmount(report.TotalVAT)}</Text>
          <Text style={cellStyle(6)}>{formatAmount(report.TotalIncludingVAT)}</Text>
        </View>
      </View>

      <View
        style={styles.footer}
        fixed
      >
        <Text>{COMPANY_NAME} - Expense Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  </Document>
);
