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
import { canRunReport, getReportDateBounds } from '@libs/permissions';
import type { ReportType } from '@libs/types';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from 'src/hooks/use-auth';
import { useDailyScheduleReport } from 'src/hooks/reports/use-daily-schedule-report';
import { useDropoffScheduleReport } from 'src/hooks/reports/use-dropoff-schedule-report';
import { useInsuranceReport } from 'src/hooks/reports/use-insurance-report';
import { useSimCardReport } from 'src/hooks/reports/use-simcard-report';
import DailyScheduleReport from 'src/sections/report/DailyScheduleReport';
import InsuranceReport from 'src/sections/report/InsuranceReport';
import SimCardReport from 'src/sections/report/SimCardReport';

// Report types that take a single Start/End date range rather than the pickup/drop pair
const DATE_RANGE_REPORT_TYPES = ['40', '50'];

// Dropdown value -> permission catalog key (see libs/src/types/user.ts ReportType)
const REPORT_TYPE_BY_VALUE: Record<string, ReportType> = {
  '10': 'DailySchedule',
  '20': 'Availability',
  '30': 'Settlement',
  '40': 'SimCard',
  '50': 'Insurance'
};

// Formats using local date parts (avoids the UTC shift toISOString() would introduce)
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const { user } = useAuth();
  const [reportType, setReportType] = React.useState('');
  const [reportData, setReportData] = React.useState<Booking[]>([]);
  const [dropoffReportData, setDropoffReportData] = React.useState<Booking[]>([]);
  const [pickupDate, setPickupDate] = React.useState<Date | null>(new Date());
  const [dropoffDate, setDropoffDate] = React.useState<Date | null>(new Date());
  const [startDate, setStartDate] = React.useState<Date | null>(new Date());
  const [endDate, setEndDate] = React.useState<Date | null>(new Date());
  const dailyScheduleStore = useDailyScheduleReport();
  const dropoffScheduleStore = useDropoffScheduleReport();
  const simCardReportStore = useSimCardReport();
  const insuranceReportStore = useInsuranceReport();

  const { minDate, maxDate } = useMemo(() => getReportDateBounds(user), [user]);

  const handleChange = (event: SelectChangeEvent) => {
    const report = event.target.value;
    setReportType(report);
    // Reset report data when changing report type
    if (report !== '10') {
      setReportData([]);
      setDropoffReportData([]);
    }
  };

  const handleRunReport = useCallback(async () => {
    if (reportType && reportType === '10') {
      // Format the dates using local date parts for the API
      const pickupDateStr = pickupDate ? toLocalDateString(pickupDate) : undefined;
      const dropoffDateStr = dropoffDate ? toLocalDateString(dropoffDate) : undefined;

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

    if (DATE_RANGE_REPORT_TYPES.includes(reportType)) {
      const startDateStr = startDate ? toLocalDateString(startDate) : undefined;
      const endDateStr = endDate ? toLocalDateString(endDate) : undefined;

      if (!startDateStr || !endDateStr) {
        return;
      }

      if (reportType === '40') {
        await simCardReportStore.handleReportGet(startDateStr, endDateStr);
      }

      if (reportType === '50') {
        await insuranceReportStore.handleReportGet(startDateStr, endDateStr);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reportType,
    dailyScheduleStore,
    dropoffScheduleStore,
    pickupDate,
    dropoffDate,
    simCardReportStore,
    insuranceReportStore,
    startDate,
    endDate
  ]);
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
          {canRunReport(user, 'DailySchedule') && (
            <MenuItem value="10">Daily Schedule Report</MenuItem>
          )}
          {canRunReport(user, 'Availability') && (
            <MenuItem value="20">Availability Report</MenuItem>
          )}
          {canRunReport(user, 'Settlement') && <MenuItem value="30">Settlement Report</MenuItem>}
          {canRunReport(user, 'SimCard') && <MenuItem value="40">SimCard Report</MenuItem>}
          {canRunReport(user, 'Insurance') && <MenuItem value="50">Insurance Report</MenuItem>}
        </Select>
        {/* <FormHelperText>select report and click on run</FormHelperText> */}
      </FormControl>
      {DATE_RANGE_REPORT_TYPES.includes(reportType) ? (
        <Box
          component="div"
          sx={{ p: 2, border: '1px grey' }}
        >
          <DatePicker
            label="Start Date"
            value={startDate}
            minDate={minDate ?? undefined}
            maxDate={maxDate ?? undefined}
            onChange={(newValue) => setStartDate(newValue)}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            minDate={minDate ?? undefined}
            maxDate={maxDate ?? undefined}
            onChange={(newValue) => setEndDate(newValue)}
          />
        </Box>
      ) : (
        <Box
          component="div"
          sx={{ p: 2, border: '1px grey' }}
        >
          <DatePicker
            label="Pickup"
            value={pickupDate}
            minDate={minDate ?? undefined}
            maxDate={maxDate ?? undefined}
            onChange={(newValue) => setPickupDate(newValue)}
          />
          <DatePicker
            label="Drop"
            value={dropoffDate}
            minDate={minDate ?? undefined}
            maxDate={maxDate ?? undefined}
            onChange={(newValue) => setDropoffDate(newValue)}
          />
        </Box>
      )}

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
      {reportType === '40' && simCardReportStore.rows.length > 0 && (
        <Box>
          <SimCardReport rows={simCardReportStore.rows} />
        </Box>
      )}
      {reportType === '50' && insuranceReportStore.rows.length > 0 && (
        <Box>
          <InsuranceReport rows={insuranceReportStore.rows} />
        </Box>
      )}
      <Backdrop
        open={simCardReportStore.isLoading || insuranceReportStore.isLoading}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
}
