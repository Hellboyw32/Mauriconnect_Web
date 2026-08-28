import type { Booking } from '@libs/types';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';

interface PdfColumn {
  header: string;
  width: string;
  render: (booking: Booking, index: number) => string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
    fontSize: 8,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 10
  },
  table: {
    borderWidth: 1,
    borderColor: '#d0d0d0'
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0'
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5'
  },
  rowAlt: {
    backgroundColor: '#fafafa'
  },
  headerCell: {
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5
  },
  cell: {
    padding: 4,
    fontSize: 7.5
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    fontSize: 7,
    color: '#999999',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});

const formatDateTime = (value: unknown): string => {
  if (!value) return '';
  try {
    const date = new Date(value as string);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(value);
  }
};

const pickupColumns: PdfColumn[] = [
  { header: '#', width: '3%', render: (_b, index) => String(index + 1) },
  { header: 'Customer Name', width: '16%', render: (b) => b.CustomerName || '' },
  { header: 'Pickup Date', width: '10%', render: (b) => formatDateTime(b.PickUpDate) },
  { header: 'Dropoff Date', width: '10%', render: (b) => formatDateTime(b.DropOffDate) },
  { header: 'Flight No.', width: '8%', render: (b: any) => b.FlightNo || '' },
  { header: 'Day(s)', width: '5%', render: (b) => String(b.NumberOfDays ?? '') },
  { header: 'Price', width: '8%', render: (b) => b.Price || '' },
  { header: 'Car Model', width: '10%', render: (b: any) => b.Category || '' },
  { header: 'Pickup Location', width: '13%', render: (b: any) => b.PickupLocation || '' },
  { header: 'Comments', width: '17%', render: (b) => b.SpecialRequest || '' }
];

const dropoffColumns: PdfColumn[] = [
  { header: '#', width: '3%', render: (_b, index) => String(index + 1) },
  { header: 'Customer Name', width: '16%', render: (b) => b.CustomerName || '' },
  { header: 'Pickup Date', width: '10%', render: (b) => formatDateTime(b.PickUpDate) },
  { header: 'Dropoff Date', width: '10%', render: (b) => formatDateTime(b.DropOffDate) },
  { header: 'Price', width: '8%', render: (b) => b.Price || '' },
  { header: 'Car Number', width: '13%', render: (b: any) => b.CarNumber || '' },
  { header: 'Fuel Level', width: '5%', render: (b) => b.FuelLevel || '' },
  { header: 'Drop-off Location', width: '13%', render: (b: any) => b.DropOffPlace || '' },
  { header: 'Delivered By', width: '7%', render: (b: any) => b.DeliveredBy || '' },
  { header: 'Comments', width: '15%', render: (b) => b.SpecialRequest || '' }
];

const ScheduleTable = ({
  title,
  rows,
  columns
}: {
  title: string;
  rows: Booking[];
  columns: PdfColumn[];
}) => (
  // A single logical Page whose content is allowed to overflow - react-pdf automatically
  // splits it across as many physical pages as needed, repeating any `fixed` element
  // (title, header row, footer) on each generated page. No manual row cap.
  <Page
    size="A4"
    orientation="landscape"
    style={styles.page}
  >
    <Text
      style={styles.title}
      fixed
    >
      {title}
    </Text>
    <Text
      style={styles.subtitle}
      fixed
    >
      Generated {format(new Date(), 'dd/MM/yyyy HH:mm')}
    </Text>
    <View style={styles.table}>
      <View
        style={styles.headerRow}
        fixed
      >
        {columns.map((column) => (
          <Text
            key={column.header}
            style={[styles.headerCell, { width: column.width }]}
          >
            {column.header}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <View style={styles.row}>
          <Text style={styles.cell}>No records</Text>
        </View>
      ) : (
        rows.map((row, rowIndex) => (
          <View
            key={row.BookingId ?? rowIndex}
            style={[styles.row, ...(rowIndex % 2 === 1 ? [styles.rowAlt] : [])]}
            wrap={false}
          >
            {columns.map((column) => (
              <Text
                key={column.header}
                style={[styles.cell, { width: column.width }]}
              >
                {column.render(row, rowIndex)}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
    <View
      style={styles.footer}
      fixed
    >
      <Text>Mauriconnect Portal</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  </Page>
);

interface DailySchedulePdfDocumentProps {
  bookings: Booking[];
  dropoffBookings: Booking[];
}

export const DailySchedulePdfDocument = ({
  bookings,
  dropoffBookings
}: DailySchedulePdfDocumentProps) => (
  <Document title="Daily Schedule Report">
    <ScheduleTable
      title="Pickup Schedule"
      rows={bookings}
      columns={pickupColumns}
    />
    <ScheduleTable
      title="Drop-off Schedule"
      rows={dropoffBookings}
      columns={dropoffColumns}
    />
  </Document>
);
