import type { Booking, BookingsSearchState, Filters } from '@libs/types';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useDailyScheduleReport } from 'src/hooks/reports/use-daily-schedule-report';
import { useDropoffScheduleReport } from 'src/hooks/reports/use-dropoff-schedule-report';
import DailyScheduleReport from 'src/sections/report/DailyScheduleReport';

const useBookingsSearch = () => {
  const [state, setState] = useState<BookingsSearchState>({
    filters: {
      customerName: undefined,
      pickupDate: undefined,
      dropoffDate: undefined
    },
    page: 0,
    rowsPerPage: -1,
    sortBy: 'customerName',
    sortDir: 'asc'
  });
};

export default function SelectLabels() {
  const [reportType, setReportType] = React.useState('');
  const [reportData, setReportData] = React.useState<Booking[]>([]);
  const [dropoffReportData, setDropoffReportData] = React.useState<Booking[]>([]);
  const [pickupDate, setPickupDate] = React.useState<Date | null>(new Date());
  const [dropoffDate, setDropoffDate] = React.useState<Date | null>(new Date());
  const dailyScheduleStore = useDailyScheduleReport();
  const dropoffScheduleStore = useDropoffScheduleReport();

  const handleChange = (event: SelectChangeEvent) => {
    const report = event.target.value;
    setReportType(report);
    // Reset report data when changing report type
    if (report !== '10') {
      setReportData([]);
    }
  };

  const handleRunReport = useCallback(async () => {
    if (reportType && reportType === '10') {
      // Format the dates as ISO strings for the API
      const pickupDateStr = pickupDate ? pickupDate.toISOString().split('T')[0] : undefined;
      const dropoffDateStr = dropoffDate ? dropoffDate.toISOString().split('T')[0] : undefined;

      console.log(
        'Running report with pickup date:',
        pickupDateStr,
        'dropoff date:',
        dropoffDateStr
      );

      // Fetch both pickup and dropoff schedules
      const pickupData = await dailyScheduleStore.handleBookingGet(pickupDateStr);
      const dropoffData = await dropoffScheduleStore.handleBookingGet(dropoffDateStr);

      console.log('Pickup data:', pickupData);
      console.log('Dropoff data:', dropoffData);

      setReportData(pickupData);
      setDropoffReportData(dropoffData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dailyScheduleStore, dropoffScheduleStore, pickupDate, dropoffDate]);
  return (
    <div>
      <FormControl sx={{ m: 1, minWidth: 300 }}>
        <InputLabel id="demo-simple-select-helper-label">Reports</InputLabel>
        <Select
          labelId="demo-simple-select-helper-label"
          id="demo-simple-select-helper"
          value={reportType}
          label="Reports"
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value="10">Daily Schedule Report</MenuItem>
          <MenuItem value="20">Availability Report</MenuItem>
          <MenuItem value="30">Settlement Report</MenuItem>
        </Select>
        {/* <FormHelperText>select report and click on run</FormHelperText> */}
      </FormControl>
      <Box
        component="div"
        sx={{ p: 2, border: '1px grey' }}
      >
        <DatePicker
          label="Pickup"
          value={pickupDate}
          onChange={(newValue) => setPickupDate(newValue)}
        />
        <DatePicker
          label="Drop"
          value={dropoffDate}
          onChange={(newValue) => setDropoffDate(newValue)}
        />
      </Box>

      <Box
        component="div"
        sx={{ p: 2, border: '1px grey' }}
      >
        <Button
          onClick={handleRunReport}
          variant="contained"
        >
          Run Report
        </Button>
      </Box>
      {reportType === '10' && (reportData.length > 0 || dropoffReportData.length > 0) && (
        <Box>
          <DailyScheduleReport
            bookings={reportData}
            dropoffBookings={dropoffReportData}
          />
        </Box>
      )}
    </div>
  );
}
